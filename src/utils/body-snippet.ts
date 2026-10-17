// Byte-based limits (UTF-8)
const MAX_BODY_BYTES_DEFAULT = 50_000; // ~50 KB
const MAX_BODY_BYTES_JSON = 500 * 1024; // 500 KB
const MAX_BODY_BYTES_TEXT = 200 * 1024; // 200 KB

// Safety gate: avoid JSON.parse+stringify for very large strings.
const MAX_JSON_MINIFY_BYTES = 1_000_000; // 1 MB

const NETWORK = {
  MAX_BODY_BYTES_DEFAULT,
  MAX_BODY_BYTES_JSON,
  MAX_BODY_BYTES_TEXT,
  MAX_JSON_MINIFY_BYTES,
};

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

export function tryMinifyJsonString(s: string): string | null {
  const t = s.trim();
  if (!(t.startsWith("{") || t.startsWith("["))) return null;
  try {
    const obj = JSON.parse(s);
    // Intentionally compact (one-line). Presentation/pretty-print should be done by the consumer UI.
    return JSON.stringify(obj);
  } catch {
    return null;
  }
}

export type BodySnippetResult = {
  snippet?: string;
  /** UTF-8 bytes of the returned snippet */
  snippetBytes?: number;
  /** UTF-8 bytes of the source (best-effort) */
  sizeBytes?: number;
  truncated?: boolean;
  isBlob?: boolean;
};

function normaliseContentType(contentType?: string): string | undefined {
  if (!contentType) return undefined;
  const t = String(contentType).toLowerCase();
  const mime = t.split(";")[0]?.trim();
  return mime || undefined;
}

function isJsonMime(mime?: string): boolean {
  if (!mime) return false;
  return mime === "application/json" || mime.endsWith("+json");
}

function maxBytesForContentType(contentType?: string): number {
  const mime = normaliseContentType(contentType);
  if (isJsonMime(mime)) return NETWORK.MAX_BODY_BYTES_JSON;
  if (mime === "text/plain" || mime === "text/html")
    return NETWORK.MAX_BODY_BYTES_TEXT;
  return NETWORK.MAX_BODY_BYTES_DEFAULT;
}

function utf8ByteLength(s: string): number {
  let bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const cp = s.codePointAt(i)!;
    if (cp <= 0x7f) bytes += 1;
    else if (cp <= 0x7ff) bytes += 2;
    else if (cp <= 0xffff) bytes += 3;
    else {
      bytes += 4;
      i++; // surrogate pair
    }
  }
  return bytes;
}

function utf8TruncateToBytes(
  s: string,
  maxBytes: number
): { out: string; outBytes: number; truncated: boolean } {
  if (maxBytes <= 0) return { out: "", outBytes: 0, truncated: s.length > 0 };

  let bytes = 0;
  let end = 0;
  for (let i = 0; i < s.length; i++) {
    const cp = s.codePointAt(i)!;
    const add = cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4;
    if (bytes + add > maxBytes) break;
    bytes += add;
    end = i + 1;
    if (cp > 0xffff) {
      i++;
      end = i + 1;
    }
  }

  const out = end === s.length ? s : s.slice(0, end);
  return { out, outBytes: bytes, truncated: end !== s.length };
}

function maybeMinifyJsonString(
  input: string,
  contentType?: string
): { text: string; sizeBytes: number } {
  // Best-effort: only try to JSON.parse+stringify if it looks like JSON and is not huge.
  const mime = normaliseContentType(contentType);
  const looksJson =
    isJsonMime(mime) ||
    input.trim().startsWith("{") ||
    input.trim().startsWith("[");

  const originalBytes = utf8ByteLength(input);
  if (!looksJson) return { text: input, sizeBytes: originalBytes };
  if (originalBytes > NETWORK.MAX_JSON_MINIFY_BYTES)
    return { text: input, sizeBytes: originalBytes };

  const min = tryMinifyJsonString(input);
  if (min == null) return { text: input, sizeBytes: originalBytes };
  return { text: min, sizeBytes: utf8ByteLength(min) };
}

export function buildBodySnippet(
  body: any,
  options?: { contentType?: string }
): BodySnippetResult {
  try {
    const contentType = options?.contentType;
    const maxBytes = maxBytesForContentType(contentType);

    if (body == null) return {};

    if (isRNBlobLike(body)) {
      const p = blobPlaceholder(body);
      const snippetBytes = p.snippet ? utf8ByteLength(p.snippet) : undefined;
      const sizeBytes = typeof p.size === "number" ? p.size : undefined;
      return {
        snippet: p.snippet,
        snippetBytes,
        sizeBytes,
        truncated: false,
        isBlob: true,
      };
    }

    let text: string;
    let sizeBytes: number | undefined;

    if (
      body &&
      typeof body === "object" &&
      Array.isArray((body as any)._parts)
    ) {
      text = JSON.stringify(fromEntries((body as any)._parts));
      sizeBytes = utf8ByteLength(text);
    } else if (typeof body === "string") {
      const r = maybeMinifyJsonString(body, contentType);
      text = r.text;
      sizeBytes = r.sizeBytes;
    } else if (body instanceof URLSearchParams) {
      text = body.toString();
      sizeBytes = utf8ByteLength(text);
    } else if (typeof body === "object") {
      text = JSON.stringify(body);
      sizeBytes = utf8ByteLength(text);
    } else {
      text = String(body);
      sizeBytes = utf8ByteLength(text);
    }

    const t = utf8TruncateToBytes(text, maxBytes);
    return {
      snippet: t.out,
      snippetBytes: t.outBytes,
      sizeBytes,
      truncated:
        t.truncated ||
        (typeof sizeBytes === "number" ? sizeBytes > maxBytes : false),
    };
  } catch {
    return {};
  }
}
