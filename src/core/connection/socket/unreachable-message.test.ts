import { describe, expect, it } from "vitest";

import { unreachableMessage } from "./unreachable-message";

describe("unreachableMessage", () => {
  it("names the address, its source and the system's reason", () => {
    expect(
      unreachableMessage({
        host: "192.168.1.148",
        port: 35678,
        source: "cloud",
        reason: "Host unreachable",
      }),
    ).toBe(
      "Can't reach Heimdall at 192.168.1.148:35678 (cloud): Host unreachable. Same Wi-Fi as the computer, no VPN?",
    );
  });

  it("points a typed-in address to the host's settings", () => {
    expect(
      unreachableMessage({
        host: "10.0.0.2",
        port: 35678,
        source: "manual",
        reason: "Connection refused.",
      }),
    ).toBe(
      "Can't reach Heimdall at 10.0.0.2:35678 (manual): Connection refused. Same Wi-Fi, no VPN? The address may have changed: see Heimdall → Settings → Connection.",
    );
  });
});
