import { SESSION_STORAGE, SESSION } from "./constants";

export function clearLastConnection() {
  try {
    SESSION_STORAGE.delete(SESSION.KEY_LAST_HOST);
    SESSION_STORAGE.delete(SESSION.KEY_LAST_PORT);
    SESSION_STORAGE.delete(SESSION.KEY_LAST_CHANNEL);
  } catch {
    // ignore
  }
}
