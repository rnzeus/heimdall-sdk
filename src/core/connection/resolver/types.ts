export type ConnectionTarget = {
  host: string;
  port: number;
  channel: string;
  hostName?: string;
};

export type ConnectionResolver = {
  resolve: () => Promise<ConnectionTarget | null>;
};
