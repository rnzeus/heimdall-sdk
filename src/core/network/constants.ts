// Byte-based limits (UTF-8)
const MAX_BODY_BYTES_DEFAULT = 50_000; // ~50 KB
const MAX_BODY_BYTES_JSON = 500 * 1024; // 500 KB
const MAX_BODY_BYTES_TEXT = 200 * 1024; // 200 KB

// Safety gate: avoid JSON.parse+stringify for very large strings.
const MAX_JSON_MINIFY_BYTES = 1_000_000; // 1 MB

export const NETWORK = {
  MAX_BODY_BYTES_DEFAULT,
  MAX_BODY_BYTES_JSON,
  MAX_BODY_BYTES_TEXT,
  MAX_JSON_MINIFY_BYTES,
};
