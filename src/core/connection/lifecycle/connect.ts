import { patchXHR } from "../../network";
import { patchWebSocket } from "../../websocket";
import { patchConsole } from "../../console";
import { resolveEnabled, setSdkEnabled } from "../sdk-enabled";
import {
  createSession,
  setCurrentSession,
  type ConnectionSource,
} from "../session";
import type { HeimdallConnectOptions } from "../../../types";
import { connectSocket } from "../socket";
import { registerCloudUrl, setLastCloudTarget } from "../../cloud/state";
import type { ConnectionTarget } from "../resolver";
import type { SecureTransport } from "../socket/secure-transport";

export function connect(options: HeimdallConnectOptions) {
  connectWithTransport({ options });
}

function connectWithTransport({
  options,
  secure,
  source,
}: {
  options: HeimdallConnectOptions;
  secure?: SecureTransport;
  source?: ConnectionSource;
}) {
  const enabled = resolveEnabled(options.enabled);
  if (!enabled) {
    setSdkEnabled(false);
    return;
  }

  setSdkEnabled(true);
  registerCloudUrl(options.cloud?.url);

  const session = {
    ...createSession(options, source),
    ...(secure ? { secure } : {}),
  };

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

  if (options.captureConsole !== false) {
    patchConsole();
  }
}

export function connectToCloudTarget({
  defaults,
  target,
}: {
  defaults: Omit<HeimdallConnectOptions, "channel">;
  target: ConnectionTarget;
}) {
  setLastCloudTarget({ channel: target.channel, hostName: target.hostName });
  connectWithTransport({
    options: {
      ...defaults,
      host: target.host,
      port: target.port,
      channel: target.channel,
    },
    secure: target.secure,
    source: "cloud",
  });
}
