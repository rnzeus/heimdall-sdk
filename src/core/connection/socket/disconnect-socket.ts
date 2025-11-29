import { getSocket, setSocket, setConnected } from "./state";
import { clearEarlyEvents, disableCaptureEarlyEvents } from "./early-buffer";
import { clearLastConnection, setCurrentSession } from "../session";

export function disconnectSocket() {
  const socket = getSocket();

  if (socket) {
    try {
      // first remove listeners, then gracefully close, then hard close
      socket.removeAllListeners?.();
      socket.end?.();
      socket.destroy();
    } catch {
      // ignore any socket-level errors
    } finally {
      setSocket(null);
    }
  }

  setConnected(false);
  setCurrentSession(null);
  clearLastConnection();
  clearEarlyEvents();
  disableCaptureEarlyEvents();
}
