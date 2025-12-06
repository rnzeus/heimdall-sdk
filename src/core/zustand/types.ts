export type ZustandEventPayload = {
  type: "zustand";
  store: string;
  ts: number;
  state: unknown;
  prevState?: unknown;
  action?: string;
};
