import { beforeEach, describe, expect, it, vi } from "vitest";

const sent: Array<{ type: string; requestId: string }> = [];
vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));
vi.mock("../connection", () => ({ sendEvent: (payload: { type: string; requestId: string }) => sent.push(payload) }));

const { createXhrCallbacks } = await import("./xhr-callbacks");

describe("xhr callbacks", () => {
  beforeEach(() => {
    sent.length = 0;
  });

  it("reports the start of a request when it is sent and its completion with the same requestId", async () => {
    const callbacks = createXhrCallbacks({ requests: new Map(), getFilters: () => ({}) });
    const xhr = { _index: 0 };

    callbacks.openCallback("post", "https://api.example.com/cart", xhr);
    callbacks.requestHeadersCallback("Content-Type", "application/json", xhr);
    callbacks.sendCallback('{"item":1}', xhr);

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      type: "networkStart",
      method: "POST",
      path: "/cart",
      requestHeaders: { "content-type": "application/json" },
    });

    callbacks.responseCallback(200, 0, "{}", "https://api.example.com/cart", "text", xhr);
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1]).toMatchObject({ type: "network", requestId: sent[0]?.requestId, status: 200 });
  });
});
