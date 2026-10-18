import type * as Sdk from "../index";

export type { HeimdallConnectOptions } from "../types/public";
export type { Channel } from "../core/public";

const noop: typeof Sdk = {
  connect: () => {},
  disconnect: () => {},
  configureConnectPrompt: () => {},
  showSDKConnectPrompt: () => {},
  HeimdallConnectPrompt: Object.assign(() => null, {
    displayName: "HeimdallConnectPrompt",
  }),
};

export const {
  connect,
  disconnect,
  configureConnectPrompt,
  showSDKConnectPrompt,
  HeimdallConnectPrompt,
} = noop;
