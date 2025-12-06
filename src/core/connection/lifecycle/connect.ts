import { patchFetch } from "../../network";
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

  // save session, but the connected flag will be set by socket.on("connect")
  setCurrentSession(session);

  try {
    connectSocket(session);
  } catch {
    // if the TCP socket fails synchronously — rollback the state
    setCurrentSession(null);
    setSdkEnabled(false);
    return;
  }

  patchFetch({
    allowedHosts: options.allowedHosts,
    ignoreUrls: options.ignoreUrls,
  });
}
