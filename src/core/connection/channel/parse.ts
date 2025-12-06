import { CHANNEL_SCHEME, type Channel, type ChannelParts } from "./types";

/**
 * Check if value looks like a Heimdall Channel
 */
export function isChannel(value: string): value is Channel {
  return value.startsWith(CHANNEL_SCHEME);
}

/**
 * Parse Heimdall Channel into {scheme, slug, shortId}
 */
export function parseChannel(value: string): ChannelParts | null {
  if (!isChannel(value)) return null;

  const raw = value.slice(CHANNEL_SCHEME.length);
  const lastDash = raw.lastIndexOf("-");
  if (lastDash <= 0) return null;

  const slug = raw.slice(0, lastDash);
  const shortId = raw.slice(lastDash + 1);

  if (!slug || !shortId) return null;

  return {
    scheme: CHANNEL_SCHEME,
    slug,
    shortId,
  };
}
