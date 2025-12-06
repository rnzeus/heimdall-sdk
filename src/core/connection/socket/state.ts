let socket: any | null = null;
let connected = false;
let lastError: string | null = null;

export function getLastError() {
  return lastError;
}
export function setLastError(value: string | null) {
  lastError = value;
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
}
