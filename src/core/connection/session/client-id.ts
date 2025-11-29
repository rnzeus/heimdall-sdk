import { SESSION, SESSION_STORAGE } from "./constants";

export function generateClientId(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function getOrCreateClientId(): string {
  try {
    const existing = SESSION_STORAGE.getString(SESSION.KEY_CLIENT_ID);
    if (existing) return existing;

    const next = generateClientId();
    SESSION_STORAGE.set(SESSION.KEY_CLIENT_ID, next);
    return next;
  } catch {
    return generateClientId();
  }
}

export function clearClientId() {
  try {
    SESSION_STORAGE.delete(SESSION.KEY_CLIENT_ID);
  } catch {
    // ignore
  }
}
