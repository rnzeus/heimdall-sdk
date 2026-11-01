import type {
  FrameSource,
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
  subscribeCaptureScreen,
  subscribeHostConfig,
  subscribeSocketState,
} from "../connection";
import { SESSION, SESSION_STORAGE } from "../connection/session/constants";

type FramesSourceFrame = {
  data: string;
  width: number;
  height: number;
  ts: number;
  source?: FrameSource;
};

type FramesSourceTap = Pick<ScreenTapEventPayload, "x" | "y" | "ts" | "kind">;

type FramesSourceStatus = Pick<
  FramesStatusEventPayload,
  "state" | "reason" | "fps" | "deviceClass" | "source"
>;

/** A native screen capturer, e.g. @rnzeus/heimdall-lens; the SDK only decides when it runs. */
export type FramesSource = {
  capability: FramesCapability;
  start: (options: { fps: number; maxWidth: number; allowRecording: boolean }) => void;
  stop: () => void;
  /** one frame of the screen as it is now, also while no loop runs */
  captureNow: (options: { maxWidth: number }) => Promise<FramesSourceFrame>;
  subscribe: (handlers: {
    onFrame: (frame: FramesSourceFrame) => void;
    onStatus: (status: FramesSourceStatus) => void;
    onTap: (tap: FramesSourceTap) => void;
  }) => () => void;
};

type Running = { fps: number; maxWidth: number; allowRecording: boolean };

let source: FramesSource | null = null;
let running: Running | null = null;
let unsubscribeSource: (() => void) | null = null;
let lastHostFrames: HostConfigFrames | undefined;

/** What the connect prompt shows: whether this app can capture, the tester's choice and how capture goes. */
export type FramesRecordingState = {
  isAvailable: boolean;
  /** the tester's choice on this device, kept across launches */
  isAllowed: boolean;
  status: FramesSourceStatus | null;
};

const RECORDING_OFF = "off";
let recordingState: FramesRecordingState = {
  isAvailable: false,
  isAllowed: SESSION_STORAGE.getString(SESSION.KEY_FRAMES_RECORDING) !== RECORDING_OFF,
  status: null,
};
const recordingListeners = new Set<() => void>();

function updateRecordingState(next: Partial<FramesRecordingState>) {
  recordingState = { ...recordingState, ...next };
  for (const listener of recordingListeners) listener();
}

export function getFramesRecordingState(): FramesRecordingState {
  return recordingState;
}

export function subscribeFramesRecording(listener: () => void): () => void {
  recordingListeners.add(listener);
  return () => {
    recordingListeners.delete(listener);
  };
}

/** The tester's choice: off keeps frames off on this device — iOS does not even ask — until turned back on. */
export function setFramesRecordingAllowed(isAllowed: boolean) {
  if (isAllowed) SESSION_STORAGE.delete(SESSION.KEY_FRAMES_RECORDING);
  else SESSION_STORAGE.set(SESSION.KEY_FRAMES_RECORDING, RECORDING_OFF);
  updateRecordingState({ isAllowed });
  applyFrames(lastHostFrames);
}

function sendFrame(frame: FramesSourceFrame) {
  // Frames are the first thing to give up: never queued, dropped while the socket is still busy.
  if (getSocket()?.writableNeedDrain) return;
  sendFrameNow(frame);
}

function sendFrameNow(frame: FramesSourceFrame) {
  internalSendNetworkEvent({
    type: "screenFrame",
    id: generateRandomId(),
    ts: frame.ts,
    width: frame.width,
    height: frame.height,
    mime: "image/jpeg",
    data: frame.data,
    source: frame.source,
  });
}

function sendStatus(status: FramesSourceStatus) {
  updateRecordingState({ status });
  internalSendNetworkEvent({
    type: "framesStatus",
    id: generateRandomId(),
    ts: Date.now(),
    state: status.state,
    reason: status.reason,
    fps: status.fps,
    deviceClass: status.deviceClass,
    source: status.source,
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
  updateRecordingState({ status: null });
  unsubscribeSource?.();
  unsubscribeSource = null;
  source.stop();
}

/** The host asks for a rate and width; the SDK never goes above what the app allowed. */
function applyFrames(frames: HostConfigFrames | undefined) {
  lastHostFrames = frames;
  if (!source) return;
  if (!frames?.enabled || !isConnected()) {
    stopCapture();
    return;
  }
  const { maxFps, maxWidth } = source.capability;
  const next: Running = {
    fps: Math.min(frames.fps ?? maxFps, maxFps),
    maxWidth: Math.min(frames.maxWidth ?? maxWidth, maxWidth),
    allowRecording: recordingState.isAllowed,
  };
  if (
    running &&
    running.fps === next.fps &&
    running.maxWidth === next.maxWidth &&
    running.allowRecording === next.allowRecording
  ) {
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
  updateRecordingState({ isAvailable: true });
  subscribeHostConfig((config) => applyFrames(config.frames));
  subscribeCaptureScreen(captureScreen);
  subscribeSocketState(() => {
    if (!isConnected()) stopCapture();
  });
}

/** A bug report opened on the host: the screen as it is now, also while frames are off — not if the tester said no. */
function captureScreen() {
  if (!source || !isConnected() || !recordingState.isAllowed) return;
  source
    .captureNow({ maxWidth: running?.maxWidth ?? source.capability.maxWidth })
    .then(sendFrameNow)
    .catch(() => {});
}
