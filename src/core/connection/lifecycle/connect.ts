import { patchXHR } from "../../network";
import { patchWebSocket } from "../../websocket";
import { resolveEnabled, setSdkEnabled } from "../sdk-enabled";
import { createSession, setCurrentSession } from "../session";
import type { HeimdallConnectOptions } from "../../../types";
import { connectSocket } from "../socket";

export function connect(options: HeimdallConnectOptions) {
  const enabled = resolveEnabled(options.enabled);
  if (!enabled) {
    setSdkEnabled(false);
    return;
  }

  setSdkEnabled(true);

  const session = createSession(options);

  setCurrentSession(session);

  try {
    connectSocket(session);
  } catch {
    setCurrentSession(null);
    setSdkEnabled(false);
    return;
  }

  const patched = patchXHR({
    allowedHosts: options.allowedHosts,
    ignoreUrls: options.ignoreUrls,
  });
  if (!patched) {
    if (__DEV__) {
      console.warn(
        "[Heimdall] XHRInterceptor not available — network logs disabled."
      );
    } else {
      // ignore, feature-specific logging
    }
  }

  patchWebSocket({
    allowedHosts: options.allowedHosts,
    ignoreUrls: options.ignoreUrls,
  });
}
