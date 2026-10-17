const MAX_DEPTH = 4;
const MAX_ENTRIES = 20;
const MAX_STRING = 2048;

const clip = (value: string) =>
  value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;

/**
 * Converts any value into a JSON-safe snapshot with depth, width and string limits.
 * Never throws: getters that throw and host objects become placeholders.
 */
function toSafeValue(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value ?? null;
  const kind = typeof value;
  if (kind === "string") return clip(value as string);
  if (kind === "number") return Number.isFinite(value) ? value : String(value);
  if (kind === "boolean") return value;
  if (kind === "bigint") return `${String(value)}n`;
  if (kind === "symbol") return String(value);
  if (kind === "function") return `[Function ${(value as Function).name || "anonymous"}]`;

  const object = value as object;
  if (seen.has(object)) return "[Circular]";

  if (value instanceof Error) {
    return {
      name: value.name,
      message: clip(String(value.message)),
      ...(value.stack ? { stack: clip(String(value.stack)) } : {}),
    };
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
  }
  if (depth >= MAX_DEPTH) return Array.isArray(value) ? "[Array]" : "[Object]";

  seen.add(object);
  try {
    if (Array.isArray(value)) {
      const items = value.slice(0, MAX_ENTRIES).map((item) => toSafeValue(item, depth + 1, seen));
      if (value.length > MAX_ENTRIES) items.push(`… ${value.length - MAX_ENTRIES} more`);
      return items;
    }
    const out: Record<string, unknown> = {};
    const keys = Object.keys(object);
    for (const key of keys.slice(0, MAX_ENTRIES)) {
      try {
        out[key] = toSafeValue((object as Record<string, unknown>)[key], depth + 1, seen);
      } catch {
        out[key] = "[Unreadable]";
      }
    }
    if (keys.length > MAX_ENTRIES) out["…"] = `${keys.length - MAX_ENTRIES} more keys`;
    return out;
  } catch {
    return "[Unreadable]";
  } finally {
    seen.delete(object);
  }
}

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(toSafeValue(value)) ?? String(value);
  } catch {
    return "[Unserializable]";
  }
}
