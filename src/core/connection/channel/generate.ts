import { CHANNEL_SCHEME, type Channel } from "./types";
import { sanitizeChannelSlug } from "./sanitize";

/**
 * Generate a random short ID (default length = 6).
 */
export function generateShortId(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
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
