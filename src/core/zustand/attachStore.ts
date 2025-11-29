import { isSdkEnabled, sendEvent } from "@core/connection";
import type { StateCreator } from "zustand";
import type { ZustandEventPayload } from "./types";

/**
 * Middleware-style wrapper, like devtools/immer:
 *
 *   const useStore = create(
 *     attachZustandStore("connection", (set, get, api) => ({ ... }))
 *   );
 */
export function attachZustandStore<TState>(
  storeName: string,
  createState: StateCreator<TState, [], []>
): StateCreator<TState, [], []> {
  // actionName lives in the closure for this store
  let currentActionName: string | undefined;

  return (set, get, api) => {
    // if the SDK is disabled — simply create the store without any tracing
    if (!isSdkEnabled()) {
      return createState(set, get, api);
    }

    // create the store as usual
    const initialState = createState(set, get, api);

    // wrap all top-level functions to catch the "action" name
    const wrappedState: any = { ...initialState };

    for (const key of Object.keys(wrappedState)) {
      const value = wrappedState[key];
      if (typeof value === "function") {
        const original = value;
        wrappedState[key] = (...args: any[]) => {
          const prev = currentActionName;
          currentActionName = key;
          try {
            return original(...args);
          } finally {
            // restore the previous action (in case of nested calls)
            currentActionName = prev;
          }
        };
      }
    }

    // the first prevState is the initialState (already wrapped methods)
    let prevState = wrappedState as TState;

    // subscribe to changes
    const unsubscribe = api.subscribe(() => {
      if (!isSdkEnabled()) {
        return;
      }

      const nextState = api.getState() as TState;

      const payload: ZustandEventPayload = {
        type: "zustand",
        store: storeName,
        ts: Date.now(),
        state: nextState,
        prevState,
        action: currentActionName,
      };

      prevState = nextState;

      sendEvent(payload);
    });

    (api as any).__HEIMDALL_ZUSTAND_UNSUB__ = unsubscribe;

    // initial snapshot (one time, immediately after creating the store)
    if (isSdkEnabled()) {
      const initialPayload: ZustandEventPayload = {
        type: "zustand",
        store: storeName,
        ts: Date.now(),
        state: prevState,
      };

      sendEvent(initialPayload);
    }

    // return the already "wrapped" state
    return wrappedState as TState;
  };
}
