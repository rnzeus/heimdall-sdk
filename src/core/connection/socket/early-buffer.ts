import { SOCKET } from "./constants";
import type { EventWirePayload } from "../../../types";

const earlyEvents: EventWirePayload[] = [];
let captureEarlyEvents = false;

export function getEarlyEvents(): EventWirePayload[] {
  return earlyEvents;
}

export function getCaptureEarlyEvents(): boolean {
  return captureEarlyEvents;
}

export function enableCaptureEarlyEvents() {
  captureEarlyEvents = true;
}

export function disableCaptureEarlyEvents() {
  captureEarlyEvents = false;
}

export function pushEarlyEvent(payload: EventWirePayload) {
  earlyEvents.push(payload);
  if (earlyEvents.length > SOCKET.MAX_EARLY_EVENTS) {
    earlyEvents.shift();
  }
}

export function clearEarlyEvents() {
  earlyEvents.length = 0;
}
