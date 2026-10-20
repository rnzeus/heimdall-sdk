import type { HeimdallConnectOptions } from "../../../types";
import type { ConnectionSource, HeimdallSession } from "./types";
import { getOrCreateClientId, generateClientId } from "./client-id";
import { SESSION_STORAGE, SESSION } from "./constants";

export function createSession(
  options: HeimdallConnectOptions,
  source: ConnectionSource = "manual"
): HeimdallSession {
  const clientId = getOrCreateClientId();
  const sessionId = generateClientId();
  const createdAt = new Date().toISOString();

  try {
    SESSION_STORAGE.set(SESSION.KEY_LAST_HOST, options.host);
    SESSION_STORAGE.set(SESSION.KEY_LAST_PORT, String(options.port));
    SESSION_STORAGE.set(SESSION.KEY_LAST_CHANNEL, options.channel);
    SESSION_STORAGE.set(SESSION.KEY_LAST_SOURCE, source);
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
