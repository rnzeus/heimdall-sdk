import { getSocket, isConnected } from "./state";

import { clearEarlyEvents, getEarlyEvents } from "./early-buffer";
import { internalSendNetworkEvent } from "./send-event";
import { getCurrentSession } from "../session";

export function flushEarlyEvents() {
  const socket = getSocket();
  const connected = isConnected();
  const currentSession = getCurrentSession();
  const earlyEvents = getEarlyEvents();

  if (!socket || !connected || !currentSession) return;
  if (earlyEvents.length === 0) return;

  for (const ev of earlyEvents) {
    internalSendNetworkEvent(ev);
  }

  clearEarlyEvents();
}
