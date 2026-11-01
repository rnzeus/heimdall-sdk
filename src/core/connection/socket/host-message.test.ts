import { safeParseHostWireMessageV1 } from "@rnzeus/heimdall-protocol";
import { describe, expect, it, vi } from "vitest";

import { handleHostLine, parseHostConfig, subscribeHostConfig } from "./host-message";

const line = (value: unknown) => JSON.stringify(value);

describe("parseHostConfig", () => {
  it("reads frames and ignores unknown fields and sections", () => {
    const config = { kind: "hostConfig", v: 1, frames: { enabled: true, fps: 1, maxWidth: 480, extra: 1 }, inspector: {} };
    expect(parseHostConfig(line(config))).toEqual({ frames: { enabled: true, fps: 1, maxWidth: 480 } });
  });

  it("treats a config without frames as frames off", () => {
    expect(parseHostConfig(line({ kind: "hostConfig", v: 1 }))).toEqual({});
  });

  it("agrees with the protocol schema on invalid configs", () => {
    for (const config of [
      { kind: "hostConfig", v: 1, frames: { fps: 1 } },
      { kind: "hostConfig", v: 1, frames: null },
      { kind: "hostConfig", v: 2 },
      { kind: "helloAck", v: 1, status: "accepted" },
    ]) {
      expect(parseHostConfig(line(config))).toBeNull();
      expect(safeParseHostWireMessageV1(config).data?.kind === "hostConfig").toBe(false);
    }
    expect(parseHostConfig("not json")).toBeNull();
  });
});

describe("handleHostLine", () => {
  it("passes configs to subscribers and skips other messages", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeHostConfig(listener);
    handleHostLine(line({ kind: "helloAck", v: 1, status: "accepted" }));
    handleHostLine(line({ kind: "hostConfig", v: 1, frames: { enabled: false } }));
    unsubscribe();
    handleHostLine(line({ kind: "hostConfig", v: 1 }));
    expect(listener.mock.calls).toEqual([[{ frames: { enabled: false, fps: undefined, maxWidth: undefined } }]]);
  });
});
