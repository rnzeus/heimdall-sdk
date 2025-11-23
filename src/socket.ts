import TcpSocket from "react-native-tcp-socket";
import type { HeimdallConnectOptions } from "./types";
import type {
  NetworkWireMessageV1,
  NetworkWireEventPayload,
  HelloWireMessageV1,
} from "./protocol";
import type { HeimdallSession } from "./session";

let socket: any | null = null;
let connected = false;
let currentSession: HeimdallSession | null = null;

// ===== early collection (before connect) =====

const MAX_EARLY_EVENTS = 50;
// events that arrived BEFORE the first connect()
const earlyEvents: NetworkWireEventPayload[] = [];
let captureEarlyEvents = false;

export function enableCaptureEarlyEvents() {
  captureEarlyEvents = true;
}

function pushEarlyEvent(payload: NetworkWireEventPayload) {
  if (!captureEarlyEvents) return;
  earlyEvents.push(payload);
  if (earlyEvents.length > MAX_EARLY_EVENTS) {
    earlyEvents.shift();
  }
}

function clearEarlyEvents() {
  earlyEvents.length = 0;
}

function internalSendNetworkEvent(payload: NetworkWireEventPayload) {
  if (!socket || !connected || !currentSession) return;

  const { options, clientId, sessionId } = currentSession;

  const message: NetworkWireMessageV1 = {
    kind: "network",
    v: 1,
    channel: options.channel,
    clientId,
    sessionId,
    deviceName: options.deviceName,
    platform: options.platform,
    appId: options.appId,
    event: payload,
  };

  try {
    socket.write(JSON.stringify(message) + "\r\n");
  } catch {
    // ignore
  }
}

function flushEarlyEvents() {
  if (!socket || !connected || !currentSession) return;
  if (earlyEvents.length === 0) return;

  for (const ev of earlyEvents) {
    internalSendNetworkEvent(ev);
  }

  clearEarlyEvents();
}

// ===== public API =====

export function connectSocket(
  optionsOrSession: HeimdallSession | HeimdallConnectOptions
) {
  const session: HeimdallSession = (optionsOrSession as HeimdallSession)
    .clientId
    ? (optionsOrSession as HeimdallSession)
    : {
        clientId: "legacy-" + Math.random().toString(16).slice(2),
        sessionId: Math.random().toString(16).slice(2),
        createdAt: new Date().toISOString(),
        options: optionsOrSession as HeimdallConnectOptions,
      };

  const options = session.options;
  const enabled = options.enabled ?? __DEV__;
  if (!enabled) return;

  // if there is already a connection with the same parameters — do nothing
  if (
    socket &&
    connected &&
    currentSession &&
    currentSession.options.channel === options.channel &&
    currentSession.options.host === options.host &&
    currentSession.options.port === options.port
  ) {
    return;
  }

  // break the old socket, if it was
  if (socket || currentSession) {
    disconnectSocket();
  }

  currentSession = session;

  socket = TcpSocket.createConnection(
    {
      host: options.host,
      port: options.port,
    },
    () => {
      connected = true;

      if (currentSession) {
        const hello: HelloWireMessageV1 = {
          kind: "hello",
          v: 1,
          channel: options.channel,
          clientId: session.clientId,
          sessionId: session.sessionId,
          deviceName: options.deviceName,
          platform: options.platform,
          appId: options.appId,
        };

        try {
          socket!.write(JSON.stringify(hello) + "\r\n");
        } catch {
          // ignore
        }

        // 🔥 after HELLO — send all events collected before connect()
        flushEarlyEvents();
      }
    }
  );

  socket.on("error", (_error: any) => {
    connected = false;
    // early events were already sent or there are no early events — don't touch earlyEvents
  });

  socket.on("close", () => {
    connected = false;
    socket = null;
    currentSession = null;
    // on close we don't flush and don't save earlyEvents — this is not the same session
    clearEarlyEvents();
    captureEarlyEvents = false;
  });
}

export function disconnectSocket() {
  if (socket) {
    try {
      socket.destroy();
    } catch {
      // ignore
    }
    socket = null;
  }
  connected = false;
  currentSession = null;
  clearEarlyEvents();
  captureEarlyEvents = false;
}

export function destroySocket() {
  disconnectSocket();
}

/**
 * Logic:
 * - IF no currentSession:
 *      • if captureEarlyEvents is enabled → put it in earlyEvents
 *      • otherwise ignore
 * - IF there is a currentSession:
 *      • if the socket is ready → send it immediately
 *      • if the socket is not ready → DO NOT buffer (as you want)
 */
export function sendNetworkEvent(payload: NetworkWireEventPayload) {
  if (!currentSession) {
    if (captureEarlyEvents) {
      pushEarlyEvent(payload);
    }
    return;
  }

  if (!socket || !connected) {
    // connect() was already called, but the socket is not ready — in v1 we don't buffer, just drop
    return;
  }

  internalSendNetworkEvent(payload);
}
