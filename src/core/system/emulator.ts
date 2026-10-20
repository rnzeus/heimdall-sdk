const ANDROID_EMULATOR =
  /generic|emulator|sdk_gphone|google_sdk|android sdk built for|genymotion|vbox/i;

const FIELDS = ["Fingerprint", "Model", "Brand", "Manufacturer"];

export function isAndroidEmulator(constants: Record<string, unknown>): boolean {
  return FIELDS.some((key) => {
    const value = constants[key];
    return typeof value === "string" && ANDROID_EMULATOR.test(value);
  });
}
