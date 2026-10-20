import { safeParseHostWireMessageV1 } from "@rnzeus/heimdall-protocol";
import { describe, expect, it } from "vitest";

import {
  matchesPin,
  parseHostAnswer,
  readPeerCertificate,
  rejectionMessage,
} from "./secure-transport";

const secure = {
  cert: "-----BEGIN CERTIFICATE-----",
  pubkey: "MIIBCgKCAQEA",
  fingerprint256: "D7:3A:F3:A5",
  token: "secret",
};

describe("matchesPin", () => {
  it("pins the public key on iOS", () => {
    expect(
      matchesPin({ peer: { pubkey: "MIIBCgKCAQEA" }, secure, platform: "ios" })
    ).toBe(true);
    expect(
      matchesPin({ peer: { pubkey: "other" }, secure, platform: "ios" })
    ).toBe(false);
    expect(
      matchesPin({
        peer: { fingerprint256: "D7:3A:F3:A5" },
        secure,
        platform: "ios",
      })
    ).toBe(false);
  });

  it("pins the certificate fingerprint on Android", () => {
    expect(
      matchesPin({
        peer: { fingerprint256: "D7:3A:F3:A5" },
        secure,
        platform: "android",
      })
    ).toBe(true);
    expect(
      matchesPin({
        peer: { fingerprint256: "00:00" },
        secure,
        platform: "android",
      })
    ).toBe(false);
  });

  it("fails without a peer certificate", () => {
    expect(matchesPin({ peer: null, secure, platform: "ios" })).toBe(false);
    expect(matchesPin({ peer: {}, secure, platform: "android" })).toBe(false);
  });
});

describe("readPeerCertificate", () => {
  it("waits until the handshake exposes the certificate", async () => {
    let calls = 0;
    const socket = {
      getPeerCertificate: async () => {
        calls++;
        if (calls === 1) throw new Error("not ready");
        return calls < 3 ? null : { pubkey: "key" };
      },
    };
    await expect(readPeerCertificate(socket)).resolves.toEqual({
      pubkey: "key",
    });
    expect(calls).toBe(3);
  });
});

describe("parseHostAnswer", () => {
  it("reads accepted and rejected answers", () => {
    expect(
      parseHostAnswer('{"kind":"helloAck","v":1,"status":"accepted"}')
    ).toEqual({
      accepted: true,
    });
    expect(
      parseHostAnswer(
        '{"kind":"helloAck","v":1,"status":"rejected","reason":"auth"}'
      )
    ).toEqual({ accepted: false, reason: "auth" });
  });

  it("accepts an answer from a newer host", () => {
    expect(
      parseHostAnswer(
        '{"kind":"helloAck","v":1,"status":"rejected","reason":"busy","extra":1}'
      )
    ).toEqual({ accepted: false, reason: undefined });
  });

  it("agrees with the protocol schema", () => {
    const lines = [
      '{"kind":"helloAck","v":1,"status":"accepted","hostVersion":"0.4.0"}',
      '{"kind":"helloAck","v":1,"status":"rejected","reason":"version"}',
      '{"kind":"helloAck","v":1,"status":"rejected","reason":"busy"}',
      '{"kind":"helloAck","v":1,"status":"pending"}',
      '{"kind":"helloAck","v":2,"status":"accepted"}',
      '{"kind":"hello","v":1,"status":"accepted"}',
      "[]",
      "null",
    ];
    for (const line of lines) {
      const schema = safeParseHostWireMessageV1(JSON.parse(line));
      const expected = schema.success
        ? schema.data.status === "accepted"
          ? { accepted: true }
          : { accepted: false, reason: schema.data.reason }
        : null;
      expect(parseHostAnswer(line)).toEqual(expected);
    }
  });

  it("returns null for anything else", () => {
    expect(parseHostAnswer("garbage")).toBeNull();
    expect(parseHostAnswer('{"kind":"hello","v":1}')).toBeNull();
  });
});

describe("rejectionMessage", () => {
  it("explains each reason", () => {
    expect(rejectionMessage("auth")).toMatch(/restarted/);
    expect(rejectionMessage("version")).toMatch(/Update Heimdall/);
    expect(rejectionMessage(undefined)).toMatch(/refused/);
  });
});
