import { patchFetch, restoreFetch } from "./patch-fetch";
import { setPromptDefaults } from "./prompt-state";
import {
  connectSocket,
  destroySocket,
  disconnectSocket,
  enableCaptureEarlyEvents,
} from "./socket";
import type { HeimdallConnectOptions } from "./types";
import {
  clearLastConnection,
  createSession,
  loadLastConnection,
} from "./session";
import type { HeimdallSession } from "./session";

let currentSession: HeimdallSession | null = null;
let connected = false;

// global flag — needed to know if the SDK is enabled
let sdkEnabled = false;

function resolveEnabled(flag: boolean | undefined): boolean {
  return flag ?? __DEV__;
}

export function isSdkEnabled(): boolean {
  return sdkEnabled;
}

export function connect(options: HeimdallConnectOptions) {
  const enabled = resolveEnabled(options.enabled);
  if (!enabled) {
    sdkEnabled = false;
    return;
  }

  sdkEnabled = true;

  const session = createSession(options);

  currentSession = session;
  connected = true;

  connectSocket(session);

  patchFetch({
    allowedHosts: options.allowedHosts,
    ignoreUrls: options.ignoreUrls,
  });
}

export function configureConnectPrompt(
  defaults: Omit<HeimdallConnectOptions, "channel">
) {
  const { captureEarlyEvents, keepAlive, enabled, ...rest } =
    defaults as HeimdallConnectOptions & {
      captureEarlyEvents?: boolean;
      keepAlive?: boolean;
    };

  const resolvedEnabled = resolveEnabled(enabled);

  if (!resolvedEnabled) {
    sdkEnabled = false;
    return;
  }

  sdkEnabled = true;

  setPromptDefaults({
    ...rest,
    enabled: resolvedEnabled,
  });

  // early collection (before connect), if needed
  if (captureEarlyEvents) {
    enableCaptureEarlyEvents();
    // patch without filters; then connect will update allowedHosts/ignoreUrls
    patchFetch();
  }

  // keepAlive: auto-connect on start, if there is a last session
  if (keepAlive) {
    const last = loadLastConnection();
    if (last && last.host && last.port && last.channel) {
      connect({
        ...rest,
        ...last,
        channel: last.channel!,
        enabled: resolvedEnabled,
      });
    }
  }
}

export function disconnect() {
  restoreFetch();
  disconnectSocket();
  connected = false;
  clearLastConnection();
}

export function destroy() {
  restoreFetch();
  destroySocket();
  connected = false;
  currentSession = null;
  sdkEnabled = false;
  clearLastConnection();
}

export function isConnected(): boolean {
  return connected;
}

export function getCurrentChannel(): string | null {
  return currentSession?.options.channel ?? null;
}

export function getCurrentHost(): string | null {
  return currentSession?.options.host ?? null;
}

export function getCurrentPort(): number | null {
  return currentSession?.options.port ?? null;
}

export function getCurrentOptions(): HeimdallConnectOptions | null {
  return currentSession?.options ?? null;
}

export function getCurrentSession(): HeimdallSession | null {
  return currentSession;
}
