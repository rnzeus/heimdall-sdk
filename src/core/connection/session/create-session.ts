import type { HeimdallConnectOptions } from "@types";
import type { HeimdallSession } from "./types";
import { getOrCreateClientId, generateClientId } from "./client-id";
import { SESSION_STORAGE, SESSION } from "./constants";

export function createSession(
  options: HeimdallConnectOptions
): HeimdallSession {
  const clientId = getOrCreateClientId();
  const sessionId = generateClientId();
  const createdAt = new Date().toISOString();

  try {
    SESSION_STORAGE.set(SESSION.KEY_LAST_HOST, options.host);
    SESSION_STORAGE.set(SESSION.KEY_LAST_PORT, String(options.port));
    SESSION_STORAGE.set(SESSION.KEY_LAST_CHANNEL, options.channel);
  } catch {
    // ignore
  }

  return {
    clientId,
    sessionId,
    createdAt,
    options,
  };
}
