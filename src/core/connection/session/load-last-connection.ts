import type { LastConnection } from "./types";
import { SESSION, SESSION_STORAGE } from "./constants";

export function loadLastConnection(): LastConnection | null {
  try {
    const host = SESSION_STORAGE.getString(SESSION.KEY_LAST_HOST) ?? undefined;
    const portString = SESSION_STORAGE.getString(SESSION.KEY_LAST_PORT);
    const channel =
      SESSION_STORAGE.getString(SESSION.KEY_LAST_CHANNEL) ?? undefined;

    const port = portString ? Number(portString) : undefined;
    const source =
      SESSION_STORAGE.getString(SESSION.KEY_LAST_SOURCE) === "cloud"
        ? "cloud"
        : "manual";

    if (!host && !port && !channel) return null;

    return { host, port, channel, source };
  } catch {
    return null;
  }
}
