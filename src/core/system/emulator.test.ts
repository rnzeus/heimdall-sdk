import { describe, expect, it } from "vitest";

import { isAndroidEmulator } from "./emulator";

describe("isAndroidEmulator", () => {
  it("recognises emulators", () => {
    expect(
      isAndroidEmulator({
        Fingerprint:
          "google/sdk_gphone64_arm64/emu64a:15/AE3A.240806.005/12228598:userdebug/dev-keys",
        Model: "sdk_gphone64_arm64",
      })
    ).toBe(true);
    expect(
      isAndroidEmulator({
        Fingerprint: "generic/sdk/generic:9/PSR1/1:eng/test-keys",
      })
    ).toBe(true);
    expect(isAndroidEmulator({ Model: "Android SDK built for x86" })).toBe(
      true
    );
    expect(isAndroidEmulator({ Manufacturer: "Genymotion" })).toBe(true);
  });

  it("leaves real phones alone", () => {
    expect(
      isAndroidEmulator({
        Fingerprint:
          "google/husky/husky:15/AP4A.250105.002/12701944:user/release-keys",
        Model: "Pixel 8 Pro",
        Brand: "google",
        Manufacturer: "Google",
      })
    ).toBe(false);
    expect(
      isAndroidEmulator({
        Fingerprint:
          "samsung/dm3qxxx/dm3q:14/UP1A.231005.007/S918BXXS3BWK3:user/release-keys",
        Model: "SM-S918B",
      })
    ).toBe(false);
    expect(isAndroidEmulator({})).toBe(false);
  });
});
