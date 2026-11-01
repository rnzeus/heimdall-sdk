import { beforeEach, describe, expect, it, vi } from "vitest";

const connection = vi.hoisted(() => ({
  connected: true,
  needDrain: false,
  sent: [] as Array<Record<string, unknown>>,
  hostConfig: null as null | ((config: { frames?: unknown }) => void),
  socketState: null as null | (() => void),
  captureScreen: null as null | (() => void),
  capability: undefined as unknown,
  stored: new Map<string, string>(),
}));

vi.mock("../connection/session/constants", () => ({
  SESSION: { KEY_FRAMES_RECORDING: "framesRecording" },
  SESSION_STORAGE: {
    getString: (key: string) => connection.stored.get(key),
    set: (key: string, value: string) => connection.stored.set(key, value),
    delete: (key: string) => connection.stored.delete(key),
  },
}));

vi.mock("../connection", () => ({
  getSocket: () => ({ writableNeedDrain: connection.needDrain }),
  isConnected: () => connection.connected,
  internalSendNetworkEvent: (payload: Record<string, unknown>) => {
    connection.sent.push(payload);
    return true;
  },
  setCapability: ({ value }: { value: unknown }) => {
    connection.capability = value;
  },
  subscribeHostConfig: (listener: (config: { frames?: unknown }) => void) => {
    connection.hostConfig = listener;
  },
  subscribeSocketState: (listener: () => void) => {
    connection.socketState = listener;
  },
  subscribeCaptureScreen: (listener: () => void) => {
    connection.captureScreen = listener;
  },
}));

import {
  getFramesRecordingState,
  registerFramesSource,
  setFramesRecordingAllowed,
  type FramesSource,
} from "./index";

type Handlers = Parameters<FramesSource["subscribe"]>[0];
const handlers: Handlers = { onFrame: () => {}, onStatus: () => {}, onTap: () => {} };
const source = {
  capability: { maxFps: 2, maxWidth: 480 },
  start: vi.fn(),
  stop: vi.fn(),
  captureNow: vi.fn(async () => ({ data: "now", width: 480, height: 1040, ts: 9, source: "snapshot" as const })),
  subscribe: vi.fn((next: Handlers) => {
    Object.assign(handlers, next);
    return () => {};
  }),
} satisfies FramesSource;

const frame = { data: "abc", width: 480, height: 1040, ts: 1 };

describe("frames", () => {
  beforeEach(() => {
    connection.connected = true;
    connection.needDrain = false;
    connection.sent = [];
    connection.hostConfig?.({});
    source.start.mockClear();
    source.stop.mockClear();
    source.captureNow.mockClear();
    setFramesRecordingAllowed(true);
    source.start.mockClear();
  });

  it("announces the capability once registered", () => {
    registerFramesSource(source);
    expect(connection.capability).toEqual({ maxFps: 2, maxWidth: 480 });
  });

  it("starts when the host asks, capped by the app's limits", () => {
    connection.hostConfig?.({ frames: { enabled: true, fps: 5, maxWidth: 720 } });
    expect(source.start).toHaveBeenCalledWith({ fps: 2, maxWidth: 480, allowRecording: true });
    connection.hostConfig?.({ frames: { enabled: true, fps: 5 } });
    expect(source.start).toHaveBeenCalledTimes(1);
    connection.hostConfig?.({ frames: { enabled: true, fps: 1 } });
    expect(source.stop).toHaveBeenCalledTimes(1);
    expect(source.start).toHaveBeenLastCalledWith({ fps: 1, maxWidth: 480, allowRecording: true });
  });

  it("stops when the host turns frames off or the connection drops", () => {
    connection.hostConfig?.({ frames: { enabled: true } });
    connection.hostConfig?.({});
    expect(source.stop).toHaveBeenCalledTimes(1);
    connection.hostConfig?.({ frames: { enabled: true } });
    connection.connected = false;
    connection.socketState?.();
    expect(source.stop).toHaveBeenCalledTimes(2);
  });

  it("sends frames and statuses, drops frames while the socket is busy", () => {
    connection.hostConfig?.({ frames: { enabled: true } });
    handlers.onFrame(frame);
    connection.needDrain = true;
    handlers.onFrame(frame);
    handlers.onStatus({ state: "paused", reason: "slow_device", fps: 0.25, deviceClass: "low" });
    expect(connection.sent.map((event) => event.type)).toEqual(["screenFrame", "framesStatus"]);
    expect(connection.sent[0]).toMatchObject({ mime: "image/jpeg", data: "abc", width: 480, ts: 1 });
    expect(connection.sent[1]).toMatchObject({ state: "paused", reason: "slow_device", fps: 0.25 });
  });

  it("sends taps even while the socket is busy", () => {
    connection.hostConfig?.({ frames: { enabled: true } });
    connection.needDrain = true;
    handlers.onTap({ x: 0.5, y: 0.25, ts: 7, kind: "longPress" });
    expect(connection.sent).toEqual([
      expect.objectContaining({ type: "screenTap", x: 0.5, y: 0.25, ts: 7, kind: "longPress" }),
    ]);
  });

  it("starts with recording off once the tester turned it off, and remembers it", () => {
    connection.hostConfig?.({ frames: { enabled: true } });
    setFramesRecordingAllowed(false);
    expect(source.stop).toHaveBeenCalled();
    expect(source.start).toHaveBeenLastCalledWith({ fps: 2, maxWidth: 480, allowRecording: false });
    expect(connection.stored.get("framesRecording")).toBe("off");
    expect(getFramesRecordingState().isAllowed).toBe(false);
  });

  it("sends a frame of the screen now when the host asks, unless the tester said no", async () => {
    connection.captureScreen?.();
    await vi.waitFor(() => expect(connection.sent).toHaveLength(1));
    expect(connection.sent[0]).toMatchObject({ type: "screenFrame", data: "now", source: "snapshot" });
    setFramesRecordingAllowed(false);
    connection.captureScreen?.();
    expect(source.captureNow).toHaveBeenCalledTimes(1);
  });

  it("keeps the latest status for the prompt and forgets it when capture stops", () => {
    connection.hostConfig?.({ frames: { enabled: true } });
    handlers.onStatus({ state: "paused", reason: "recording_declined", fps: 1, deviceClass: "normal", source: "system" });
    expect(getFramesRecordingState().status?.reason).toBe("recording_declined");
    connection.hostConfig?.({});
    expect(getFramesRecordingState().status).toBeNull();
  });
});
