import { generateChannelId } from "./generate";
import { sanitizeChannelSlug } from "./sanitize";
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

const SLUG_AND_CODE = /^[a-z0-9-]+-[a-z0-9]{6}$/;

/**
 * Channel from what was typed in the prompt: a full `heimdall://…` channel as is, `slug-code` with the scheme
 * added, anything else as the slug of a new channel.
 */
export function channelFromInput(input: string): Channel {
  const typed = input.trim().toLowerCase();
  if (isChannel(typed)) return typed;
  if (SLUG_AND_CODE.test(typed)) return `${CHANNEL_SCHEME}${typed}` as Channel;
  return generateChannelId(sanitizeChannelSlug(typed || "session"));
}
