import { SESSION_STORAGE } from "../../core/connection/session/constants";

export type PromptMode = "cloud" | "manual";

const KEY_PROMPT_MODE = "promptMode";

export function loadPromptMode(): PromptMode | null {
  try {
    const value = SESSION_STORAGE.getString(KEY_PROMPT_MODE);
    return value === "cloud" || value === "manual" ? value : null;
  } catch {
    return null;
  }
}

export function savePromptMode(mode: PromptMode) {
  try {
    SESSION_STORAGE.set(KEY_PROMPT_MODE, mode);
  } catch {
    // ignore
  }
}
