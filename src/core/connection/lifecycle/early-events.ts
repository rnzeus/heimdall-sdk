import { patchXHR } from "../../network";
import { patchWebSocket } from "../../websocket";
import { patchConsole } from "../../console";
import { enableCaptureEarlyEvents } from "../socket";
import type { HeimdallConnectOptions } from "../../../types";

export function setupEarlyEvents(
  defaults: Omit<HeimdallConnectOptions, "channel">
) {
  enableCaptureEarlyEvents();
  patchXHR({
    allowedHosts: defaults.allowedHosts,
    ignoreUrls: defaults.ignoreUrls,
  });

  patchWebSocket({
    allowedHosts: defaults.allowedHosts,
    ignoreUrls: defaults.ignoreUrls,
  });

  if (defaults.captureConsole !== false) {
    patchConsole();
  }
}
