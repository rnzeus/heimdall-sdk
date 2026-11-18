export type HeimdallPlatform =
  | "ios"
  | "android"
  | "macos"
  | "windows"
  | "other";

export type HeimdallConnectOptions = {
  host: string; // 127.0.0.1 (sim) or IP mac
  port: number; // 35678
  channel: string; // channel key
  enabled?: boolean; // default __DEV__
  platform?: HeimdallPlatform;
  deviceName?: string;
  appId?: string; // bundle-id / arbitrary identifier
  /** white-list by host (without protocol and path) */
  allowedHosts?: (string | RegExp)[];
  /** additional ignore by full url or path */
  ignoreUrls?: (string | RegExp)[];
  /** capture early events (before connect) */
  captureEarlyEvents?: boolean;
  /** keep the connection alive (default: false) */
  keepAlive?: boolean;
  /** capture console.* calls, uncaught JS errors and unhandled promise rejections (default: true) */
  captureConsole?: boolean;
  /** app details shown in heimdall, e.g. from react-native-device-info */
  app?: { version?: string; build?: string; environment?: string };
  /**
   * device details the SDK cannot read without native code, e.g. from react-native-device-info:
   * `getUniqueId()` and `isEmulator()`; helps Heimdall cloud tell devices and simulators apart
   */
  device?: { id?: string; isEmulator?: boolean };
  /**
   * heimdall-cloud service: enables "Find me" device linking in the connect prompt.
   * `appKey` — the app's public key from the team's Apps page: linked devices go to the team, and Heimdall
   * applies the team's AI rules to this app. Not a secret.
   */
  cloud?: { url: string; appKey?: string };
  /**
   * What AI may get from this app's data in Heimdall, set by the app's developers: "strict" — the Strict data set,
   * no screenshots; "off" — nothing. It can only make Heimdall stricter. Not set — Heimdall's own rules apply.
   */
  ai?: "strict" | "off";
};
