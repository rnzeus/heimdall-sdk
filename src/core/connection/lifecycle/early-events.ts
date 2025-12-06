import { patchFetch } from "@core/network";
import { enableCaptureEarlyEvents } from "../socket";

/**
 * Enables early event capture (before connect)
 * and sets patchFetch without filters.
 */
export function setupEarlyEvents() {
  enableCaptureEarlyEvents();
  patchFetch(); // without filters; then connect() will update allowedHosts/ignoreUrls
}
