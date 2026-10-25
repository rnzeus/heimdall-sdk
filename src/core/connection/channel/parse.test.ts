import { describe, expect, it } from "vitest";

import { channelFromInput, parseChannel } from "./parse";

describe("channelFromInput", () => {
  it("keeps a full channel and adds the scheme to slug-code", () => {
    expect(channelFromInput("heimdall://session-ab12cd")).toBe("heimdall://session-ab12cd");
    expect(channelFromInput(" Session-AB12CD ")).toBe("heimdall://session-ab12cd");
  });

  it("makes a new channel from a name, with a code that is easy to type", () => {
    const parts = parseChannel(channelFromInput("my app"));
    expect(parts?.slug).toBe("my-app");
    expect(parts?.shortId).toMatch(/^[a-hj-np-z2-9]{6}$/);
  });
});
