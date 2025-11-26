export {
  connect,
  disconnect,
  // destroy, // NOTE: not needed for now
  configureConnectPrompt,
} from "./connection";
export { generateChannelId } from "./channel";
export type { Channel } from "./channel";
export type { HeimdallConnectOptions } from "./types";
export { showPrompt as showConnectPrompt } from "./prompt-state";
export { default as HeimdallConnectPrompt } from "./prompt";
export { attachZustandStore } from "./zustand";
