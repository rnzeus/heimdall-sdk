import type { StateCreator, StoreMutatorIdentifier } from "zustand/vanilla";
import { sendEvent, isSdkEnabled } from "../core/connection";
import { generateRandomId } from "../utils";
import type { ZustandEventPayload } from "../types";

/**
 * Heimdall middleware for Zustand.
 *
 * Usage:
 *
 *   const useStore = create(
 *     heimdallZustand("connection", (set, get, api) => ({
 *       ...
 *     }))
 *   );
 *
 * Features:
 * - Does not store history / diff in SDK.
 * - Sends snapshots of the state to Heimdall.
 * - Tries to determine the "action" by the name of the top-level function of the store.
 */
export function heimdallZustand<
  TState,
  Mis extends [StoreMutatorIdentifier, unknown][] = [],
  Mos extends [StoreMutatorIdentifier, unknown][] = []
>(
  storeName: string,
  createState: StateCreator<TState, Mis, Mos>
): StateCreator<TState, Mis, Mos> {
  let currentActionName: string | undefined;

  const wrappedCreator: StateCreator<TState, Mis, Mos> = (set, get, api) => {
    if (!isSdkEnabled()) {
      return createState(set, get, api);
    }

    const initialState = createState(set, get, api);

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
            currentActionName = prev;
          }
        };
      }
    }

    let prevState = wrappedState as TState;

    const unsubscribe = api.subscribe(() => {
      if (!isSdkEnabled()) return;

      const nextState = api.getState() as TState;

      if (nextState === prevState) return;

      const payload: ZustandEventPayload = {
        type: "zustand",
        store: storeName,
        id: generateRandomId(),
        ts: Date.now(),
        state: nextState,
        prevState,
        action: currentActionName ?? "UNKNOWN",
      };

      prevState = nextState;
      sendEvent(payload);
    });

    (api as any).__HEIMDALL_ZUSTAND_UNSUB__ = unsubscribe;

    if (isSdkEnabled()) {
      const initialPayload: ZustandEventPayload = {
        type: "zustand",
        store: storeName,
        id: generateRandomId(),
        ts: Date.now(),
        state: prevState,
        action: "INITIALIZED",
      };
      sendEvent(initialPayload);
    }

    return wrappedState as TState;
  };

  return wrappedCreator;
}
