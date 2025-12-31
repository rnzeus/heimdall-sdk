import type { NetworkFilters } from "../../types";

type WebSocketCtor = typeof WebSocket | null;

let patched = false;
let filters: NetworkFilters = {};
let originalWebSocket: WebSocketCtor = null;

export function getWsFilters(): NetworkFilters {
  return filters;
}

export function setWsFilters(value: NetworkFilters) {
  filters = value;
}

export function isWsPatched(): boolean {
  return patched;
}

export function setWsPatched(value: boolean) {
  patched = value;
}

export function getOriginalWebSocket(): WebSocketCtor {
  return originalWebSocket;
}

export function setOriginalWebSocket(ws: WebSocketCtor) {
  originalWebSocket = ws;
}
