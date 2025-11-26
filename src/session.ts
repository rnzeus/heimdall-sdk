import { MMKV } from "react-native-mmkv";
import type { HeimdallConnectOptions } from "./types";

export type HeimdallSession = {
  clientId: string;
  sessionId: string;
  createdAt: string;
  options: HeimdallConnectOptions;
};

const STORAGE_ID = "heimdall-sdk";

const KEY_CLIENT_ID = "clientId";
const KEY_LAST_HOST = "lastHost";
const KEY_LAST_PORT = "lastPort";
const KEY_LAST_CHANNEL = "lastChannel";

const storage = new MMKV({ id: STORAGE_ID });

function generateId(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function getOrCreateClientId(): string {
  try {
    const existing = storage.getString(KEY_CLIENT_ID);
    if (existing) return existing;

    const next = generateId();
    storage.set(KEY_CLIENT_ID, next);
    return next;
  } catch {
    return generateId();
  }
}

export function createSession(
  options: HeimdallConnectOptions
): HeimdallSession {
  const clientId = getOrCreateClientId();
  const sessionId = generateId();
  const createdAt = new Date().toISOString();

  try {
    storage.set(KEY_LAST_HOST, options.host);
    storage.set(KEY_LAST_PORT, String(options.port));
    storage.set(KEY_LAST_CHANNEL, options.channel);
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

export type LastConnection = {
  host?: string;
  port?: number;
  channel?: string;
};

export function loadLastConnection(): LastConnection | null {
  try {
    const host = storage.getString(KEY_LAST_HOST) ?? undefined;
    const portString = storage.getString(KEY_LAST_PORT);
    const channel = storage.getString(KEY_LAST_CHANNEL) ?? undefined;

    const port = portString ? Number(portString) : undefined;

    if (!host && !port && !channel) return null;

    return { host, port, channel };
  } catch {
    return null;
  }
}

export function clearLastConnection() {
  try {
    storage.delete(KEY_LAST_HOST);
    storage.delete(KEY_LAST_PORT);
    storage.delete(KEY_LAST_CHANNEL);
  } catch {
    // ignore
  }
}

export function clearClientId() {
  try {
    storage.delete(KEY_CLIENT_ID);
  } catch {
    // ignore
  }
}
