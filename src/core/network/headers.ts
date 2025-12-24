import type { HeadersMap } from "./xhr-types";

export function normaliseHeaderName(name: any): string | null {
  if (typeof name !== "string") return null;
  const n = name.trim().toLowerCase();
  if (!n) return null;

  // Basic RFC-ish safety: no control chars, no colon
  if (/[\u0000-\u001F\u007F]/.test(n)) return null;
  if (n.includes(":")) return null;

  return n;
}

export function normaliseHeaders(input: any): HeadersMap {
  const out: HeadersMap = {};
  if (!input || typeof input !== "object") return out;

  for (const k of Object.keys(input)) {
    const key = normaliseHeaderName(k);
    if (!key) continue;

    const v = input[k];
    if (v == null) continue;
    out[key] = Array.isArray(v) ? v.join(", ") : String(v);
  }

  return out;
}
