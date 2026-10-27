import { describe, expect, it, vi } from "vitest";

vi.mock("react-native-tcp-socket", () => ({ default: {} }));

import {
  pickReachableAddress,
  type ProbeAddress,
} from "./pick-reachable-address";

const probeAfter =
  (delays: Record<string, number | null>): ProbeAddress =>
  ({ host, signal }) =>
    new Promise((resolve) => {
      const delay = delays[host];
      const timer = setTimeout(() => resolve(delay !== null), delay ?? 5);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        resolve(false);
      });
    });

describe("pickReachableAddress", () => {
  it("returns the only address without probing", async () => {
    const probe = vi.fn();
    await expect(
      pickReachableAddress({ addresses: ["10.0.0.2"], port: 1, probe })
    ).resolves.toBe("10.0.0.2");
    expect(probe).not.toHaveBeenCalled();
  });

  it("returns null without addresses", async () => {
    await expect(
      pickReachableAddress({ addresses: [], port: 1 })
    ).resolves.toBeNull();
  });

  it("picks the first address that answers", async () => {
    const probe = probeAfter({ "172.20.0.1": null, "192.168.1.5": 10 });
    await expect(
      pickReachableAddress({
        addresses: ["172.20.0.1", "192.168.1.5"],
        port: 1,
        probe,
      })
    ).resolves.toBe("192.168.1.5");
  });

  it("prefers the faster answer and cancels the rest", async () => {
    const aborted: string[] = [];
    const probe: ProbeAddress = (options) => {
      options.signal.addEventListener("abort", () =>
        aborted.push(options.host)
      );
      return probeAfter({ a: 30, b: 5 })(options);
    };
    await expect(
      pickReachableAddress({ addresses: ["a", "b"], port: 1, probe })
    ).resolves.toBe("b");
    expect(aborted).toEqual(["a", "b"]);
  });

  it("returns null when no address answers", async () => {
    const probe = probeAfter({ a: null, b: null });
    await expect(
      pickReachableAddress({ addresses: ["a", "b"], port: 1, probe })
    ).resolves.toBeNull();
  });
});
