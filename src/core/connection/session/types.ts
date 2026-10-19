import type { HeimdallConnectOptions } from "../../../types";
import type { SecureTransport } from "../socket/secure-transport";

export type HeimdallSession = {
  clientId: string;
  sessionId: string;
  createdAt: string;
  options: HeimdallConnectOptions;
  secure?: SecureTransport;
};

export type LastConnection = {
  host?: string;
  port?: number;
  channel?: string;
};
