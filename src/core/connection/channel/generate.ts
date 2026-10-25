import { CHANNEL_SCHEME, type Channel } from "./types";
import { sanitizeChannelSlug } from "./sanitize";
import { generateRandomId } from "../../../utils";

/** Letters and digits that are not mistaken for one another when typed by hand: no 0/o, 1/i. */
const SHORT_ID_ALPHABET = "abcdefghjklmnpqrstuvwxyz23456789";

/**
 * Generate a random short ID (default length = 6).
 */
function generateShortId(length = 6): string {
  return generateRandomId(length, SHORT_ID_ALPHABET);
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
