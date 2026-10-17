import { CHANNEL_SCHEME, type Channel } from "./types";
import { sanitizeChannelSlug } from "./sanitize";
import { generateRandomId } from "../../../utils";

/**
 * Generate a random short ID (default length = 6).
 */
function generateShortId(length = 6): string {
  return generateRandomId(length, "abcdefghijklmnopqrstuvwxyz0123456789");
}

/**
 * Generate a full Channel identifier:
 *   heimdall://<slug>-<shortId>
 */
export function generateChannelId(rawSlug?: string): Channel {
  const slug = sanitizeChannelSlug(rawSlug ?? "session");
  const shortId = generateShortId();
  return `${CHANNEL_SCHEME}${slug}-${shortId}` as Channel;
}
