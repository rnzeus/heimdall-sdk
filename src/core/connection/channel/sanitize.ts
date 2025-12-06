/**
 * Normalize slug for channel:
 * - lowercase
 * - remove invalid chars
 * - collapse "-"
 * - trim edges
 * - max length 32
 */
export function sanitizeChannelSlug(input: string): string {
  const lower = input.trim().toLowerCase();
  const replaced = lower.replace(/[^a-z0-9-]+/g, "-");
  const collapsed = replaced.replace(/-+/g, "-");
  const trimmed = collapsed.replace(/^-+|-+$/g, "");
  return trimmed.slice(0, 32) || "session";
}
