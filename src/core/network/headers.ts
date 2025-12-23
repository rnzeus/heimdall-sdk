import type { HeadersMap } from "./xhr-types";

export function normaliseHeaders(input: any): HeadersMap {
  const out: HeadersMap = {};
  if (!input || typeof input !== "object") return out;

  for (const k of Object.keys(input)) {
    const v = input[k];
    if (v == null) continue;
    out[String(k).toLowerCase()] = Array.isArray(v) ? v.join(", ") : String(v);
  }

  return out;
}
