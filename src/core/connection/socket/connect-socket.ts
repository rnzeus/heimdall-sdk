import TcpSocket from "react-native-tcp-socket";
import type { HeimdallConnectOptions, HeimdallPlatform } from "../../../types";
import {
  isConnected,
  getSocket,
  setConnected,
  setSocket,
  setLastError,
} from "./state";
import { handleSocketLost } from "./handle-socket-lost";
import { flushEarlyEvents } from "./flush-early-events";
import { normalizeSocketError } from "./normalize-socket-error";
import { SOCKET } from "./constants";
import {
  getCurrentSession,
  setCurrentSession,
  type HeimdallSession,
} from "../session";
import type { HelloWireMessageV1 } from "../../../types";

export function connectSocket(
  optionsOrSession: HeimdallSession | HeimdallConnectOptions
) {
  setLastError(null);

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

  const socket = getSocket();
  const connected = isConnected();
  const currentSession = getCurrentSession();

  // If the socket is already connected and the session is the same, return
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

  // If there is an old socket, close it only, without affecting earlyEvents/lastConnection
  if (socket) {
    try {
      socket.removeAllListeners?.();
      socket.end?.();
      socket.destroy();
    } catch {
      // ignore
    } finally {
      setSocket(null);
      setConnected(false);
    }
  }

  // Update the current session to the new one
  setCurrentSession(session);

  const newSocket = TcpSocket.createConnection(
    {
      host: options.host,
      port: options.port,
    },
    () => {
      clearTimeout(connectTimeout);
      setConnected(true);

      // Take the actual session (if it changed)
      const activeSession = getCurrentSession();

      const hello: HelloWireMessageV1 = {
        kind: "hello",
        v: 1,
        channel: options.channel,
        clientId: activeSession?.clientId ?? session.clientId,
        sessionId: activeSession?.sessionId ?? session.sessionId,
        deviceName: options.deviceName,
        platform: options.platform as HeimdallPlatform,
        appId: options.appId,
      };

      try {
        newSocket.write(JSON.stringify(hello) + "\r\n");
      } catch {
        // ignore
      }

      // After successful HELLO, send early events
      flushEarlyEvents();
    }
  );

  const connectTimeout = setTimeout(() => {
    if (getSocket() !== newSocket || isConnected()) return;
    setLastError(
      `Can't reach Heimdall at ${options.host}:${options.port}. Same Wi-Fi?`
    );
    handleSocketLost();
  }, SOCKET.CONNECT_TIMEOUT_MS);

  newSocket.on("error", (error: unknown) => {
    clearTimeout(connectTimeout);
    const message = normalizeSocketError(error);
    setLastError(message);
    if (__DEV__) {
      console.warn("[Heimdall] socket error:", message);
    }
    handleSocketLost();
  });

  newSocket.on("close", () => {
    clearTimeout(connectTimeout);
    handleSocketLost();
  });

  setSocket(newSocket);
}
