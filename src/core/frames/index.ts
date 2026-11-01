import type {
  FramesCapability,
  FramesStatusEventPayload,
  HostConfigFrames,
  ScreenTapEventPayload,
} from "@rnzeus/heimdall-protocol";
import { generateRandomId } from "../../utils";
import {
  getSocket,
  internalSendNetworkEvent,
  isConnected,
  setCapability,
  subscribeHostConfig,
  subscribeSocketState,
} from "../connection";

type FramesSourceFrame = {
  data: string;
  width: number;
  height: number;
  ts: number;
};

type FramesSourceTap = Pick<ScreenTapEventPayload, "x" | "y" | "ts" | "kind">;

type FramesSourceStatus = Pick<
  FramesStatusEventPayload,
  "state" | "reason" | "fps" | "deviceClass"
>;

/** A native screen capturer, e.g. @rnzeus/heimdall-lens; the SDK only decides when it runs. */
export type FramesSource = {
  capability: FramesCapability;
  start: (options: { fps: number; maxWidth: number }) => void;
  stop: () => void;
  subscribe: (handlers: {
    onFrame: (frame: FramesSourceFrame) => void;
    onStatus: (status: FramesSourceStatus) => void;
    onTap: (tap: FramesSourceTap) => void;
  }) => () => void;
};

let source: FramesSource | null = null;
let running: { fps: number; maxWidth: number } | null = null;
let unsubscribeSource: (() => void) | null = null;

function sendFrame(frame: FramesSourceFrame) {
  // Frames are the first thing to give up: never queued, dropped while the socket is still busy.
  if (getSocket()?.writableNeedDrain) return;
  internalSendNetworkEvent({
    type: "screenFrame",
    id: generateRandomId(),
    ts: frame.ts,
    width: frame.width,
    height: frame.height,
    mime: "image/jpeg",
    data: frame.data,
  });
}

function sendStatus(status: FramesSourceStatus) {
  internalSendNetworkEvent({
    type: "framesStatus",
    id: generateRandomId(),
    ts: Date.now(),
    state: status.state,
    reason: status.reason,
    fps: status.fps,
    deviceClass: status.deviceClass,
  });
}

// Taps are tiny and mark where frames were touched, so unlike frames they are never dropped.
function sendTap(tap: FramesSourceTap) {
  internalSendNetworkEvent({
    type: "screenTap",
    id: generateRandomId(),
    ts: tap.ts,
    x: tap.x,
    y: tap.y,
    kind: tap.kind,
  });
}

function stopCapture() {
  if (!source || !running) return;
  running = null;
  unsubscribeSource?.();
  unsubscribeSource = null;
  source.stop();
}

/** The host asks for a rate and width; the SDK never goes above what the app allowed. */
function applyFrames(frames: HostConfigFrames | undefined) {
  if (!source) return;
  if (!frames?.enabled || !isConnected()) {
    stopCapture();
    return;
  }
  const { maxFps, maxWidth } = source.capability;
  const next = {
    fps: Math.min(frames.fps ?? maxFps, maxFps),
    maxWidth: Math.min(frames.maxWidth ?? maxWidth, maxWidth),
  };
  if (running && running.fps === next.fps && running.maxWidth === next.maxWidth) {
    return;
  }
  stopCapture();
  running = next;
  unsubscribeSource = source.subscribe({ onFrame: sendFrame, onStatus: sendStatus, onTap: sendTap });
  source.start(next);
}

/** Announces frames in `hello`; capture runs only while the host asks for it over a live connection. */
export function registerFramesSource(next: FramesSource) {
  if (source) return;
  source = next;
  setCapability({ name: "frames", value: next.capability });
  subscribeHostConfig((config) => applyFrames(config.frames));
  subscribeSocketState(() => {
    if (!isConnected()) stopCapture();
  });
}
