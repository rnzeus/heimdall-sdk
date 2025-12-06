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
};
