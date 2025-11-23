declare const __DEV__: boolean;

declare module "react-native-mmkv" {
  export type MMKVConfiguration = {
    id?: string;
    path?: string;
    encryptionKey?: string;
  };

  export class MMKV {
    constructor(config?: MMKVConfiguration);

    getString(key: string): string | undefined;
    getNumber(key: string): number | undefined;
    getBoolean(key: string): boolean | undefined;
    getBuffer(key: string): Uint8Array | undefined;

    set(key: string, value: string | number | boolean | Uint8Array): void;
    delete(key: string): void;
    contains(key: string): boolean;
    clearAll(): void;
  }
}
