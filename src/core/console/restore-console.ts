import { getConsoleState, resetConsoleState } from "./state";

export function restoreConsole() {
  const state = getConsoleState();
  if (!state.patched) return;

  for (const [method, original] of Object.entries(state.originals)) {
    try {
      (console as any)[method] = original;
    } catch {
      // ignore
    }
  }

  const g: any = globalThis as any;
  const errorUtils = g.ErrorUtils;
  try {
    if (
      errorUtils?.getGlobalHandler &&
      errorUtils.setGlobalHandler &&
      state.previousErrorHandler &&
      errorUtils.getGlobalHandler() === state.ownErrorHandler
    ) {
      errorUtils.setGlobalHandler(state.previousErrorHandler);
    }
  } catch {
    // ignore
  }

  resetConsoleState();
}
