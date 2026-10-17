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

function normaliseHeaders(input: any): HeadersMap {
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

/** Parses the raw "name: value\r\n" block returned by getAllResponseHeaders(). */
function parseRawHeaders(raw: string): HeadersMap {
  const out: HeadersMap = {};
  for (const line of raw.split(/\r?\n/)) {
    const index = line.indexOf(":");
    if (index <= 0) continue;
    const key = normaliseHeaderName(line.slice(0, index));
    if (!key) continue;
    const value = line.slice(index + 1).trim();
    out[key] = key in out ? `${out[key]}, ${value}` : value;
  }
  return out;
}

export function normaliseResponseHeaders(input: any): HeadersMap {
  return typeof input === "string" ? parseRawHeaders(input) : normaliseHeaders(input);
}
