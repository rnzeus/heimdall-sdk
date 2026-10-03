let socket: any | null = null;
let connected = false;
let lastError: string | null = null;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

/** Notified when the socket connects, disconnects or reports an error. */
export function subscribeSocketState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLastError() {
  return lastError;
}
export function setLastError(value: string | null) {
  lastError = value;
  notify();
}

export function getSocket(): any | null {
  return socket;
}

export function setSocket(value: any | null) {
  socket = value;
}

export function isConnected(): boolean {
  return connected;
}

export function setConnected(value: boolean) {
  connected = value;
  notify();
}
