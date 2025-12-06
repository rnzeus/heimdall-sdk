import type { LastConnection } from "./types";
import { SESSION, SESSION_STORAGE } from "./constants";

export function loadLastConnection(): LastConnection | null {
  try {
    const host = SESSION_STORAGE.getString(SESSION.KEY_LAST_HOST) ?? undefined;
    const portString = SESSION_STORAGE.getString(SESSION.KEY_LAST_PORT);
    const channel =
      SESSION_STORAGE.getString(SESSION.KEY_LAST_CHANNEL) ?? undefined;

    const port = portString ? Number(portString) : undefined;

    if (!host && !port && !channel) return null;

    return { host, port, channel };
  } catch {
    return null;
  }
}
