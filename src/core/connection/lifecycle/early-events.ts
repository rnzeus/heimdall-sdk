import { patchXHR } from "../../network";
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
}
