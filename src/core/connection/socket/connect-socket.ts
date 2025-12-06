import TcpSocket from "react-native-tcp-socket";
import type { HeimdallConnectOptions, HeimdallPlatform } from "@types";
import {
  isConnected,
  getSocket,
  setConnected,
  setSocket,
  setLastError,
} from "./state";
import { disconnectSocket } from "./disconnect-socket";
import { flushEarlyEvents } from "./flush-early-events";
import {
  getCurrentSession,
  setCurrentSession,
  type HeimdallSession,
} from "../session";
import { HelloWireMessageV1 } from "../protocol";

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

  // if there is already a connection with the same parameters — do nothing

  const socket = getSocket();
  const connected = isConnected();
  const currentSession = getCurrentSession();

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

  setCurrentSession(session);

  const newSocket = TcpSocket.createConnection(
    {
      host: options.host,
      port: options.port,
    },
    () => {
      setConnected(true);

      if (currentSession) {
        const hello: HelloWireMessageV1 = {
          kind: "hello",
          v: 1,
          channel: options.channel,
          clientId: session.clientId,
          sessionId: session.sessionId,
          deviceName: options.deviceName,
          platform: options.platform as HeimdallPlatform,
          appId: options.appId,
        };

        try {
          newSocket!.write(JSON.stringify(hello) + "\r\n");
        } catch {
          // ignore
        }

        // 🔥 after HELLO — send all events collected before connect()
        flushEarlyEvents();
      }
    }
  );

  newSocket.on("error", (error: any) => {
    setLastError(String(error?.message ?? "Unknown socket error"));
    disconnectSocket();
  });

  newSocket.on("close", () => {
    disconnectSocket();
  });

  setSocket(newSocket);
}
