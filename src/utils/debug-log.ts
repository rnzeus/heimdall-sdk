/**
 * Heimdall SDK Debug Logging
 *
 * Usage:
 * ```ts
 * // In browser console or React Native debugger:
 * globalThis.__HEIMDALL_SDK_DEBUG__ = { ws: true, network: true };
 * // or
 * globalThis.__HEIMDALL_SDK_DEBUG__ = { ws: false, network: true };
 * ```
 */

export type HeimdallDebugConfig = {
  ws?: boolean;
  console?: boolean;
  network?: boolean;
};

type DebugModule = keyof HeimdallDebugConfig;

/**
 * Check if debug logging is enabled for a specific module.
 */
function isDebugEnabled(module: DebugModule): boolean {
  try {
    const g: any = globalThis as any;
    const cfg = g.__HEIMDALL_SDK_DEBUG__;
    if (!cfg || typeof cfg !== "object") return false;
    return cfg[module] === true;
  } catch {
    return false;
  }
}

/**
 * Debug log helper for Heimdall SDK.
 * Only logs strings to avoid HostObject inspection crashes in RN/Hermes.
 *
 * @param module - Module name (ws, network, etc.)
 * @param message - Message to log
 */
export function debugLog(module: DebugModule, message: string): void {
  if (!isDebugEnabled(module)) return;
  try {
    // eslint-disable-next-line no-console
    console.log(`[Heimdall][${module}] ${message}`);
  } catch {
    // ignore
  }
}
