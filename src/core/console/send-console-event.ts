import type { ConsoleEventPayload } from "../../types";
import { generateRandomId, safeStringify } from "../../utils";
import { getCaptureEarlyEvents, getCurrentSession, sendEvent } from "../connection";
import { getConsoleState } from "./state";

const MAX_MESSAGE = 8 * 1024;
const MAX_ARGS = 16 * 1024;
const MAX_STACK = 8 * 1024;
const RATE_WINDOW_MS = 1000;
const RATE_LIMIT = 200;

const clip = (value: string, limit: number) =>
  value.length > limit ? { text: value.slice(0, limit), truncated: true } : { text: value, truncated: false };

const formatArg = (arg: unknown): string => {
  if (typeof arg === "string") return arg;
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  return safeStringify(arg);
};

const firstStack = (args: unknown[]): string | undefined => {
  for (const arg of args) {
    if (arg instanceof Error && arg.stack) return String(arg.stack);
  }
  return undefined;
};

const allowByRate = (): boolean => {
  const state = getConsoleState();
  const now = Date.now();
  if (now - state.windowStart >= RATE_WINDOW_MS) {
    const dropped = state.dropped;
    state.windowStart = now;
    state.windowCount = 0;
    state.dropped = 0;
    if (dropped > 0) {
      state.windowCount += 1;
      emit({
        level: "warn",
        source: "console",
        message: `Heimdall: ${dropped} console messages dropped (rate limit ${RATE_LIMIT}/s)`,
      });
    }
  }
  if (state.windowCount >= RATE_LIMIT) {
    state.dropped += 1;
    return false;
  }
  state.windowCount += 1;
  return true;
};

const emit = (input: {
  level: ConsoleEventPayload["level"];
  source: ConsoleEventPayload["source"];
  message: string;
  args?: string;
  stack?: string;
  fatal?: boolean;
}) => {
  const message = clip(input.message, MAX_MESSAGE);
  const args = input.args !== undefined ? clip(input.args, MAX_ARGS) : undefined;
  const stack = input.stack !== undefined ? clip(input.stack, MAX_STACK) : undefined;
  const truncated = message.truncated || Boolean(args?.truncated) || Boolean(stack?.truncated);

  const payload: ConsoleEventPayload = {
    type: "console",
    id: generateRandomId(),
    ts: Date.now(),
    level: input.level,
    source: input.source,
    message: message.text,
    ...(args ? { args: args.text } : {}),
    ...(stack ? { stack: stack.text } : {}),
    ...(input.fatal !== undefined ? { fatal: input.fatal } : {}),
    ...(truncated ? { truncated: true } : {}),
  };
  sendEvent(payload);
};

/** Guarded against re-entry: anything logged while sending is not captured again. */
export function sendConsoleEvent(input: {
  level: ConsoleEventPayload["level"];
  source: ConsoleEventPayload["source"];
  args: unknown[];
  fatal?: boolean;
}) {
  const state = getConsoleState();
  if (state.sending) return;
  if (!getCurrentSession() && !getCaptureEarlyEvents()) return;
  state.sending = true;
  try {
    if (!allowByRate()) return;
    const message = input.args.map(formatArg).join(" ");
    const hasStructured = input.args.some((arg) => arg !== null && typeof arg === "object");
    emit({
      level: input.level,
      source: input.source,
      message,
      ...(hasStructured ? { args: safeStringify(input.args) } : {}),
      stack: firstStack(input.args),
      fatal: input.fatal,
    });
  } catch {
    // never break the host app
  } finally {
    state.sending = false;
  }
}
