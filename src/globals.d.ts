declare const __DEV__: boolean;

declare global {
  interface Window {
    __HEIMDALL_SDK_DEBUG__?: {
      ws?: boolean;
      network?: boolean;
    };
  }

  var __HEIMDALL_SDK_DEBUG__:
    | {
        ws?: boolean;
        network?: boolean;
      }
    | undefined;
}

declare module "react-native-mmkv" {
  export type MMKVConfiguration = {
    id?: string;
    path?: string;
    encryptionKey?: string;
  };

  export interface MMKVInstance {
    getString(key: string): string | undefined;
    getNumber(key: string): number | undefined;
    getBoolean(key: string): boolean | undefined;
    getBuffer(key: string): Uint8Array | undefined;

    set(key: string, value: string | number | boolean | Uint8Array): void;
    delete(key: string): void;
    contains(key: string): boolean;
    clearAll(): void;
  }

  export class MMKV implements MMKVInstance {
    constructor(config?: MMKVConfiguration);
  }

  /**
   * react-native-mmkv v4+ factory API.
   * In v3 this export doesn't exist at runtime.
   */
  export function createMMKV(config?: MMKVConfiguration): MMKVInstance;
}
