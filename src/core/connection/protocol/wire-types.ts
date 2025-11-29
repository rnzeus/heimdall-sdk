import type { NetworkEventPayload } from "@core/network";
import type { ZustandEventPayload } from "@core/zustand";

type WireMessageBase = {
  kind: "hello" | "event";
  v: number;
  channel: string;
  clientId: string;
  sessionId: string;
  deviceName?: string;
  platform?: string;
  appId?: string;
};

/**
 * Hello wire message - sent once after TCP connect
 */
export type HelloWireMessageV1 = WireMessageBase & {
  kind: "hello";
  v: 1;
};

/**
 * Event wire message - sent
 */
export type EventWireMessageV1 = WireMessageBase & {
  kind: "event";
  v: 1;
  event: EventWirePayload;
};

/**
 * Event wire payload
 */
export type EventWirePayload = NetworkEventPayload | ZustandEventPayload;
