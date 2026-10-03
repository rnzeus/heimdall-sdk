import { SESSION_STORAGE } from "../connection/session/constants";

const KEY_TOKEN = "cloudDeviceToken";
const KEY_DEVICE_NAME = "cloudDeviceName";

export type CloudDevice = { token: string; name: string };

export function loadCloudDevice(): CloudDevice | null {
  try {
    const token = SESSION_STORAGE.getString(KEY_TOKEN);
    const name = SESSION_STORAGE.getString(KEY_DEVICE_NAME);
    return token ? { token, name: name ?? "This device" } : null;
  } catch {
    return null;
  }
}

export function saveCloudDevice({ token, name }: CloudDevice) {
  try {
    SESSION_STORAGE.set(KEY_TOKEN, token);
    SESSION_STORAGE.set(KEY_DEVICE_NAME, name);
  } catch {
    // ignore
  }
}

export function clearCloudDevice() {
  try {
    SESSION_STORAGE.delete(KEY_TOKEN);
    SESSION_STORAGE.delete(KEY_DEVICE_NAME);
  } catch {
    // ignore
  }
}
