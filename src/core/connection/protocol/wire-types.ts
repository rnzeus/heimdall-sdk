/**
 * HTTP fetch event
 */
// export type FetchEventPayload = {
//   type: "fetch";
//   requestId: string;
//   tsStart: number;
//   tsEnd: number;
//   method: string;
//   url: string;
//   host: string;
//   path: string;
//   status?: number;
//   ok: boolean;
//   durationMs: number;
//   error?: string;

//   requestHeaders: Record<string, string>;
//   responseHeaders: Record<string, string>;
//   requestBodySnippet: string | undefined;
//   responseBodySnippet: string | undefined;
//   requestBodySize: number | undefined;
//   responseBodySize: number | undefined;
//   requestContentType: string | undefined;
//   responseContentType: string | undefined;
// };

// /**
//  * Zustand store change event
//  */
// export type ZustandEventPayload = {
//   type: "zustand";
//   /** logical store name, e.g. "connection", "auth" */
//   store: string;
//   /** timestamp in ms */
//   ts: number;
//   /** new state snapshot */
//   state: unknown;
//   /** previous state snapshot */
//   prevState?: unknown;
//   /** action that caused the state change */
//   action?: string;
// };

// export type NetworkWireEventPayload = FetchEventPayload | ZustandEventPayload;

// /**
//  * Hello message — sent once after TCP connect
//  */
// export type HelloWireMessageV1 = {
//   kind: "hello";
//   v: 1;
//   channel: string;
//   clientId: string;
//   sessionId: string;
//   deviceName?: string;
//   platform?: HeimdallPlatform;
//   appId?: string;
// };

// /**
//  * Network wire message with event payload
//  */
// export type NetworkWireMessageV1 = {
//   kind: "network";
//   v: 1;
//   channel: string;
//   clientId: string;
//   sessionId: string;
//   deviceName?: string;
//   platform?: HeimdallPlatform;
//   appId?: string;
//   event: NetworkWireEventPayload;
// };

import type { NetworkEventPayload } from "@core/network";

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
export type EventWirePayload = NetworkEventPayload;
