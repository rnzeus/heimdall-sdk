import { isConnected, getSocket } from "./state";
import { getCaptureEarlyEvents, pushEarlyEvent } from "./early-buffer";
import type {
  EventWireMessageV1,
  EventWirePayload,
  HeimdallPlatform,
} from "../../../types";
import { getCurrentSession } from "../session";

export function sendEvent(payload: EventWirePayload) {
  const currentSession = getCurrentSession();
  const captureEarlyEvents = getCaptureEarlyEvents();
  const socket = getSocket();
  const connected = isConnected();
  if (!currentSession) {
    if (captureEarlyEvents) {
      pushEarlyEvent(payload);
    }
    return;
  }

  if (!socket || !connected) {
    // The handshake is still running: keep the event until the host accepts the session.
    pushEarlyEvent(payload);
    return;
  }

  internalSendNetworkEvent(payload);
}

/** @returns false when the event was not handed to the socket */
export function internalSendNetworkEvent(payload: EventWirePayload): boolean {
  const currentSession = getCurrentSession();
  const socket = getSocket();
  const connected = isConnected();

  if (!socket || !connected || !currentSession) return false;

  const { options, clientId, sessionId } = currentSession;

  const message: EventWireMessageV1 = {
    kind: "event",
    v: 1,
    channel: options.channel,
    clientId,
    sessionId,
    deviceName: options.deviceName,
    platform: options.platform as HeimdallPlatform,
    appId: options.appId,
    event: payload,
  };

  try {
    socket.write(JSON.stringify(message) + "\r\n");
    return true;
  } catch {
    return false;
  }
}
