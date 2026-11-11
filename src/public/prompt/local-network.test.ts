import { describe, expect, it } from "vitest";

import {
  LOCAL_NETWORK,
  localNetworkError,
  localNetworkNotice,
  shouldWaitForLocalNetwork,
} from "./local-network";

describe("shouldWaitForLocalNetwork", () => {
  const base = {
    platform: "ios",
    error: "No route to host",
    startedAt: 0,
    now: 1_000,
  };

  it("waits on iOS while the Local Network question may be open", () => {
    expect(shouldWaitForLocalNetwork(base)).toBe(true);
  });

  it("stops waiting after the window, on Android, and for other errors", () => {
    expect(
      shouldWaitForLocalNetwork({ ...base, now: LOCAL_NETWORK.waitMs })
    ).toBe(false);
    expect(shouldWaitForLocalNetwork({ ...base, platform: "android" })).toBe(
      false
    );
    expect(
      shouldWaitForLocalNetwork({ ...base, error: "Connection refused" })
    ).toBe(false);
    expect(shouldWaitForLocalNetwork({ ...base, error: null })).toBe(false);
  });
});

describe("localNetworkNotice", () => {
  it("asks to answer iOS first, then says where to turn access on", () => {
    expect(localNetworkNotice({ startedAt: 0, now: 1_000 })).toBe(
      LOCAL_NETWORK.notice
    );
    expect(
      localNetworkNotice({ startedAt: 0, now: LOCAL_NETWORK.hintAfterMs })
    ).toBe(LOCAL_NETWORK.hint);
  });
});

describe("localNetworkError", () => {
  it("names the permission after the wait on iOS and leaves other errors as they are", () => {
    expect(
      localNetworkError({ platform: "ios", error: "No route to host" })
    ).toBe(LOCAL_NETWORK.denied);
    expect(
      localNetworkError({ platform: "android", error: "No route to host" })
    ).toBe("No route to host");
    expect(
      localNetworkError({ platform: "ios", error: "Connection refused" })
    ).toBe("Connection refused");
  });
});
