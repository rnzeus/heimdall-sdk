import { Platform } from "react-native";
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
import { SDK_VERSION } from "../../../version";
import { normaliseAppInfo, readDeviceInfo } from "../../system";
import type { HelloWireMessageV1 } from "../../../types";
import {
  CERTIFICATE_MISMATCH,
  NO_ANSWER,
  matchesPin,
  parseHostAnswer,
  readPeerCertificate,
  rejectionMessage,
  type SecureTransport,
} from "./secure-transport";

const HOST_ANSWER_TIMEOUT_MS = 5_000;

function buildHello({
  session,
  options,
  secure,
}: {
  session: HeimdallSession;
  options: HeimdallConnectOptions;
  secure?: SecureTransport;
}): HelloWireMessageV1 {
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
    sdkVersion: SDK_VERSION,
  };
  const device = readDeviceInfo();
  if (device) hello.device = device;
  const app = normaliseAppInfo(options.app);
  if (app) hello.app = app;
  if (secure) hello.auth = { token: secure.token };
  return hello;
}

function fail(message: string) {
  setLastError(message);
  handleSocketLost();
}

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

  const secure = session.secure;

  const onPlainConnect = () => {
    clearTimeout(connectTimeout);
    setConnected(true);
    try {
      newSocket.write(
        JSON.stringify(buildHello({ session, options })) + "\r\n"
      );
    } catch {
      // ignore
    }
    flushEarlyEvents();
  };

  const onSecureConnect = async () => {
    const peer = await readPeerCertificate(
      newSocket as ReturnType<typeof TcpSocket.connectTLS>
    );
    if (getSocket() !== newSocket) return;
    if (!secure || !matchesPin({ peer, secure, platform: Platform.OS })) {
      clearTimeout(connectTimeout);
      fail(CERTIFICATE_MISMATCH);
      return;
    }

    let pending = "";
    const answerTimeout = setTimeout(() => {
      if (getSocket() === newSocket && !isConnected()) fail(NO_ANSWER);
    }, HOST_ANSWER_TIMEOUT_MS);
    const onData = (data: unknown) => {
      pending += typeof data === "string" ? data : String(data);
      const end = pending.indexOf("\r\n");
      if (end === -1) return;
      newSocket.off?.("data", onData);
      clearTimeout(answerTimeout);
      clearTimeout(connectTimeout);
      const answer = parseHostAnswer(pending.slice(0, end));
      if (!answer) {
        fail(NO_ANSWER);
        return;
      }
      if (!answer.accepted) {
        fail(rejectionMessage(answer.reason));
        return;
      }
      setConnected(true);
      flushEarlyEvents();
    };
    newSocket.on("data", onData);

    try {
      newSocket.write(
        JSON.stringify(buildHello({ session, options, secure })) + "\r\n"
      );
    } catch {
      // the error listener reports it
    }
  };

  const newSocket = secure
    ? TcpSocket.connectTLS(
        { host: options.host, port: options.port, ca: secure.cert },
        () => void onSecureConnect()
      )
    : TcpSocket.createConnection(
        { host: options.host, port: options.port },
        onPlainConnect
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
