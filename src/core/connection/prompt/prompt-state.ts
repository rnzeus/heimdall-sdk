import type { HeimdallConnectOptions } from "@types";

type PromptDefaults = Omit<HeimdallConnectOptions, "channel">;

type PromptState = {
  visible: boolean;
  defaults: PromptDefaults | null;
};

let state: PromptState = {
  visible: false,
  defaults: null,
};

const listeners = new Set<() => void>();

export function getPromptState(): PromptState {
  return state;
}

export function setPromptDefaults(defaults: PromptDefaults) {
  state = { ...state, defaults };
  notify();
}

export function showPrompt() {
  state = { ...state, visible: true };
  notify();
}

export function hidePrompt() {
  state = { ...state, visible: false };
  notify();
}

export function subscribePrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  for (const l of listeners) l();
}
