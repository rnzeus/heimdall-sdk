import { debugLog } from "../../utils";
import { sendConsoleEvent } from "./send-console-event";
import { type ConsoleMethod, type ErrorHandler, getConsoleState } from "./state";

const METHODS: ConsoleMethod[] = ["log", "info", "warn", "error", "debug"];
const UNHANDLED_REJECTION = /possible unhandled promise rejection|^uncaught \(in promise/i;
const UNCAUGHT_ECHO_MS = 1000;

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : typeof error === "string" ? error : "";

/** RN's default handler logs the uncaught error again via console.error right after ours. */
const isUncaughtEcho = (args: unknown[]) => {
  const last = getConsoleState().lastUncaught;
  if (!last || !last.message || Date.now() - last.ts > UNCAUGHT_ECHO_MS) return false;
  return args.some(
    (arg) =>
      (typeof arg === "string" && arg.includes(last.message)) ||
      (arg instanceof Error && arg.message === last.message)
  );
};

const isOwnMessage = (args: unknown[]) =>
  typeof args[0] === "string" && /^\[heimdall\]/i.test(args[0]);

type ErrorUtilsLike = {
  getGlobalHandler?: () => ErrorHandler;
  setGlobalHandler?: (handler: ErrorHandler) => void;
};

const getErrorUtils = (): ErrorUtilsLike | undefined => {
  const g: any = globalThis as any;
  return g.ErrorUtils as ErrorUtilsLike | undefined;
};

export function patchConsole() {
  const state = getConsoleState();
  if (state.patched || typeof console === "undefined") return;
  state.patched = true;

  for (const method of METHODS) {
    const original = (console as any)[method];
    if (typeof original !== "function") continue;
    state.originals[method] = original;

    (console as any)[method] = function heimdallConsole(...args: unknown[]) {
      original.apply(console, args);
      if (isOwnMessage(args)) return;
      if (method === "error" && isUncaughtEcho(args)) return;
      const rejection =
        (method === "warn" || method === "error") && UNHANDLED_REJECTION.test(errorMessage(args[0]));
      sendConsoleEvent({
        level: rejection ? "error" : method,
        source: rejection ? "unhandled-rejection" : "console",
        args,
      });
    };
  }

  const errorUtils = getErrorUtils();
  if (errorUtils?.getGlobalHandler && errorUtils.setGlobalHandler) {
    try {
      const previous = errorUtils.getGlobalHandler();
      const own: ErrorHandler = (error, isFatal) => {
        state.lastUncaught = { message: errorMessage(error), ts: Date.now() };
        sendConsoleEvent({ level: "error", source: "uncaught", args: [error], fatal: Boolean(isFatal) });
        if (typeof previous === "function") previous(error, isFatal);
      };
      state.previousErrorHandler = previous ?? null;
      state.ownErrorHandler = own;
      errorUtils.setGlobalHandler(own);
    } catch {
      // ignore
    }
  }

  debugLog("console", "console capture enabled");
}
