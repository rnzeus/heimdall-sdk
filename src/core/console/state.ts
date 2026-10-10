export type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug";

export type ErrorHandler = (error: unknown, isFatal?: boolean) => void;

type ConsoleState = {
  patched: boolean;
  originals: Partial<Record<ConsoleMethod, (...args: unknown[]) => void>>;
  previousErrorHandler: ErrorHandler | null;
  ownErrorHandler: ErrorHandler | null;
  sending: boolean;
  windowStart: number;
  windowCount: number;
  dropped: number;
  lastUncaught: { message: string; ts: number } | null;
};

const state: ConsoleState = {
  patched: false,
  originals: {},
  previousErrorHandler: null,
  ownErrorHandler: null,
  sending: false,
  windowStart: 0,
  windowCount: 0,
  dropped: 0,
  lastUncaught: null,
};

export function getConsoleState(): ConsoleState {
  return state;
}

export function resetConsoleState() {
  state.patched = false;
  state.originals = {};
  state.previousErrorHandler = null;
  state.ownErrorHandler = null;
  state.sending = false;
  state.windowStart = 0;
  state.windowCount = 0;
  state.dropped = 0;
  state.lastUncaught = null;
}
