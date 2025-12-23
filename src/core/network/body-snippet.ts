import { NETWORK } from "./constants";

function fromEntries(parts: any[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const p of parts) {
    if (!Array.isArray(p) || p.length < 2) continue;
    const k = String(p[0]);
    const v = p[1];

    if (out[k] === undefined) out[k] = v;
    else if (Array.isArray(out[k])) (out[k] as any[]).push(v);
    else out[k] = [out[k], v];
  }
  return out;
}

function isRNBlobLike(x: any): boolean {
  return !!(
    x &&
    typeof x === "object" &&
    (x as any)._data &&
    typeof (x as any)._data.blobId === "string"
  );
}

function blobPlaceholder(x: any): { snippet: string; size?: number } {
  const d = (x as any)?._data ?? {};
  const size = typeof d.size === "number" ? d.size : undefined;
  const type = d.type ?? "unknown";
  const name = d.name ? ` name=${d.name}` : "";
  const snippet = `[blob ${type} ${size ?? "?"} bytes${name}]`;
  return { snippet, size };
}

export function tryPrettifyJsonString(s: string): string | null {
  const t = s.trim();
  if (!(t.startsWith("{") || t.startsWith("["))) return null;
  try {
    const obj = JSON.parse(s);
    return JSON.stringify(obj, null, 2);
  } catch {
    return null;
  }
}

export function safeBodySnippet(body: any): {
  snippet?: string;
  size?: number;
  isBlob?: boolean;
} {
  try {
    if (body == null) return {};

    if (isRNBlobLike(body)) {
      const p = blobPlaceholder(body);
      return { snippet: p.snippet, size: p.size, isBlob: true };
    }

    if (
      body &&
      typeof body === "object" &&
      Array.isArray((body as any)._parts)
    ) {
      const obj = fromEntries((body as any)._parts);
      const txt = JSON.stringify(obj, null, 2);
      return {
        snippet: txt.slice(0, NETWORK.MAX_BODY_LENGTH),
        size: txt.length,
      };
    }

    if (typeof body === "string") {
      const pretty = tryPrettifyJsonString(body);
      const txt = pretty ?? body;

      return {
        snippet: txt.slice(0, NETWORK.MAX_BODY_LENGTH),
        size: txt.length,
      };
    }

    if (body instanceof URLSearchParams) {
      const txt = body.toString();
      return {
        snippet: txt.slice(0, NETWORK.MAX_BODY_LENGTH),
        size: txt.length,
      };
    }

    if (typeof body === "object") {
      const txt = JSON.stringify(body, null, 2);
      return {
        snippet: txt.slice(0, NETWORK.MAX_BODY_LENGTH),
        size: txt.length,
      };
    }
  } catch {
    // ignore
  }

  return {};
}
