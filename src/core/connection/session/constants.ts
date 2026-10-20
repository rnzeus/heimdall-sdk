import * as MMKVModule from "react-native-mmkv";

export const SESSION = {
  STORAGE_ID: "heimdall-sdk",
  KEY_CLIENT_ID: "clientId",
  KEY_LAST_HOST: "lastHost",
  KEY_LAST_PORT: "lastPort",
  KEY_LAST_CHANNEL: "lastChannel",
  KEY_LAST_SOURCE: "lastSource",
};

type SessionStorage = {
  getString(key: string): string | undefined;
  set(key: string, value: string | number | boolean | Uint8Array): void;
  delete(key: string): void;
};

function createSessionStorage(): SessionStorage {
  const mmkv: any = MMKVModule as any;

  // react-native-mmkv v4+
  if (typeof mmkv.createMMKV === "function") {
    return mmkv.createMMKV({ id: SESSION.STORAGE_ID }) as SessionStorage;
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
