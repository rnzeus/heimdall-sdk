// "Branded" type to avoid confusion between Channel and a regular string
export type Channel = string & { readonly __brand: "HeimdallChannel" };

const CHANNEL_SCHEME = "heimdall://";

export type ChannelParts = {
  scheme: "heimdall://";
  slug: string;
  shortId: string;
};

/**
 * Sanitize the slug to a clean view:
 * - lower-case
 * - keep only [a-z0-9-]
 * - everything else → '-'
 * - collapse sequences of '-'
 * - truncate the length (e.g. to 32)
 */
export function sanitizeChannelSlug(input: string): string {
  const lower = input.trim().toLowerCase();
  // replace everything that is not a letter/number/dash with a dash
  const replaced = lower.replace(/[^a-z0-9-]+/g, "-");
  // remove repeated dashes
  const collapsed = replaced.replace(/-+/g, "-");
  // remove dashes at the edges
  const trimmed = collapsed.replace(/^-+|-+$/g, "");
  // limit the length of the slug to avoid URL explosion
  return trimmed.slice(0, 32) || "session";
}

/**
 * Generate a short id, readable by the eye.
 * Can be configured with a length (default 6).
 */
export function generateShortId(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    out += chars[idx];
  }
  return out;
}

/**
 * Generate a full Channel identifier of the form:
 *   heimdall://<slug>-<shortId>
 *
 * Examples:
 *   generateChannelId('local')  → 'heimdall://local-k3f9a2'
 *   generateChannelId('QA Bug 123') → 'heimdall://qa-bug-123-8dj4pz'
 */
export function generateChannelId(rawSlug?: string): Channel {
  const slug = sanitizeChannelSlug(rawSlug ?? "session");
  const shortId = generateShortId(6);

  const value = `${CHANNEL_SCHEME}${slug}-${shortId}`;
  return value as Channel;
}

/**
 * Check if the string looks like our Channel.
 */
export function isChannel(value: string): value is Channel {
  return value.startsWith(CHANNEL_SCHEME);
}

/**
 * Parse Channel into parts: scheme, slug, shortId.
 */
export function parseChannel(value: string): ChannelParts | null {
  if (!isChannel(value)) return null;

  const withoutScheme = value.slice(CHANNEL_SCHEME.length); // "<slug>-<shortId>"
  const lastDash = withoutScheme.lastIndexOf("-");
  if (lastDash <= 0) return null;

  const slug = withoutScheme.slice(0, lastDash);
  const shortId = withoutScheme.slice(lastDash + 1);

  if (!slug || !shortId) return null;

  return {
    scheme: CHANNEL_SCHEME,
    slug,
    shortId,
  };
}
