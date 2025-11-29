import type { HeimdallSession } from "./types";

let currentSession: HeimdallSession | null = null;

export function getCurrentSession(): HeimdallSession | null {
  return currentSession;
}

export function setCurrentSession(session: HeimdallSession | null) {
  currentSession = session;
}

export function getCurrentChannel(): string | null {
  return currentSession?.options.channel ?? null;
}

export function getCurrentHost(): string | null {
  return currentSession?.options.host ?? null;
}

export function getCurrentPort(): number | null {
  return currentSession?.options.port ?? null;
}

export function getCurrentOptions() {
  return currentSession?.options ?? null;
}
