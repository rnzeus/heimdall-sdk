import { debugLog } from "../../utils";
import { sendConsoleEvent } from "./send-console-event";
import { type ConsoleMethod, type ErrorHandler, getConsoleState } from "./state";

const METHODS: ConsoleMethod[] = ["log", "info", "warn", "error", "debug"];
const UNHANDLED_REJECTION = /possible unhandled promise rejection/i;

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
      const rejection =
        method === "warn" && typeof args[0] === "string" && UNHANDLED_REJECTION.test(args[0]);
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
