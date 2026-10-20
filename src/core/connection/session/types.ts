import type { HeimdallConnectOptions } from "../../../types";
import type { SecureTransport } from "../socket/secure-transport";

export type HeimdallSession = {
  clientId: string;
  sessionId: string;
  createdAt: string;
  options: HeimdallConnectOptions;
  secure?: SecureTransport;
};

export type ConnectionSource = "cloud" | "manual";

export type LastConnection = {
  host?: string;
  port?: number;
  channel?: string;
  /** cloud connections are resolved again (fresh certificate and token), never replayed in plaintext */
  source?: ConnectionSource;
};
