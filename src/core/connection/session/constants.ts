import * as MMKVModule from "react-native-mmkv";

export const SESSION = {
  STORAGE_ID: "heimdall-sdk",
  KEY_CLIENT_ID: "clientId",
  KEY_LAST_HOST: "lastHost",
  KEY_LAST_PORT: "lastPort",
  KEY_LAST_CHANNEL: "lastChannel",
  KEY_LAST_SOURCE: "lastSource",
  /** "off" when the tester turned screen recording off on this device */
  KEY_FRAMES_RECORDING: "framesRecording",
};

type SessionStorage = {
  getString(key: string): string | undefined;
  set(key: string, value: string | number | boolean | Uint8Array): void;
  delete(key: string): void;
};

function createSessionStorage(): SessionStorage {
  const mmkv: any = MMKVModule as any;

  // react-native-mmkv v4+ renamed delete to remove
  if (typeof mmkv.createMMKV === "function") {
    const storage = mmkv.createMMKV({ id: SESSION.STORAGE_ID });
    return {
      getString: (key) => storage.getString(key),
      set: (key, value) => storage.set(key, value),
      delete: (key) => storage.remove(key),
    };
  }

  // react-native-mmkv v3
  if (typeof mmkv.MMKV === "function") {
    return new mmkv.MMKV({ id: SESSION.STORAGE_ID }) as SessionStorage;
  }

  throw new Error(
    "react-native-mmkv is installed, but neither createMMKV nor MMKV were found."
  );
}

export const SESSION_STORAGE = createSessionStorage();
