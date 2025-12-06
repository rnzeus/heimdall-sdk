import { HeimdallConnectOptions } from "@types";

export type HeimdallSession = {
  clientId: string;
  sessionId: string;
  createdAt: string;
  options: HeimdallConnectOptions;
};

export type LastConnection = {
  host?: string;
  port?: number;
  channel?: string;
};
