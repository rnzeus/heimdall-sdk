import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventWirePayload } from "../../../types";

const session = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("../session", () => ({
  getCurrentSession: () => session.current,
  setCurrentSession: (value: unknown) => {
    session.current = value;
  },
}));

import { clearEarlyEvents, getEarlyEvents } from "./early-buffer";
import { flushEarlyEvents } from "./flush-early-events";
import { sendEvent } from "./send-event";
import { setConnected, setSocket } from "./state";

const event = (requestId: string) =>
  ({ type: "network", requestId }) as unknown as EventWirePayload;

const sent = (write: ReturnType<typeof vi.fn>) =>
  write.mock.calls.map(
    ([line]) => JSON.parse(String(line)).event.requestId as string
  );

describe("sendEvent while the handshake runs", () => {
  let write: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearEarlyEvents();
    write = vi.fn();
    setSocket({ write });
    setConnected(false);
    session.current = {
      clientId: "client",
      sessionId: "session",
      options: { channel: "heimdall://local-test", platform: "ios" },
    };
  });

  it("keeps events until the host accepts and sends them in order", () => {
    sendEvent(event("a"));
    sendEvent(event("b"));
    expect(write).not.toHaveBeenCalled();

    setConnected(true);
    flushEarlyEvents();
    sendEvent(event("c"));

    expect(sent(write)).toEqual(["a", "b", "c"]);
    expect(getEarlyEvents()).toHaveLength(0);
  });
});
