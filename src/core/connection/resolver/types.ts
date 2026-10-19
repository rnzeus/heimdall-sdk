import type { SecureTransport } from "../socket/secure-transport";

export type ConnectionTarget = {
  host: string;
  port: number;
  channel: string;
  hostName?: string;
  secure?: SecureTransport;
};

export type ConnectionResolver = {
  resolve: () => Promise<ConnectionTarget | null>;
};
