import { MMKV } from "react-native-mmkv";

export const SESSION = {
  STORAGE_ID: "heimdall-sdk",
  KEY_CLIENT_ID: "clientId",
  KEY_LAST_HOST: "lastHost",
  KEY_LAST_PORT: "lastPort",
  KEY_LAST_CHANNEL: "lastChannel",
};

export const SESSION_STORAGE = new MMKV({ id: SESSION.STORAGE_ID });
