import { NativeModules, TurboModuleRegistry } from "react-native";

let cachedHost: string | null | undefined;

const hostOf = (url: unknown): string | null => {
  if (typeof url !== "string") return null;
  const match = /^https?:\/\/([^/?#]+)/i.exec(url);
  return match ? match[1].toLowerCase() : null;
};

const readScriptUrl = (): unknown => {
  try {
    const turbo: any = TurboModuleRegistry.get("SourceCode");
    const url = turbo?.getConstants?.().scriptURL;
    if (url) return url;
  } catch {}
  try {
    const legacy: any = NativeModules.SourceCode;
    return legacy?.getConstants?.().scriptURL ?? legacy?.scriptURL;
  } catch {}
  return null;
};

/**
 * host:port of the Metro server the bundle was loaded from (e.g. "127.0.0.1:8081"),
 * or null for an embedded release bundle. Traffic to it is RN tooling, never app traffic.
 */
export function getDevServerHost(): string | null {
  if (cachedHost === undefined) cachedHost = hostOf(readScriptUrl());
  return cachedHost;
}

export function isDevServerHost(host: string): boolean {
  const devServer = getDevServerHost();
  return devServer !== null && host.toLowerCase() === devServer;
}
