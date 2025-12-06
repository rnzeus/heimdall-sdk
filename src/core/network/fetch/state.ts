type OriginalFetch = typeof fetch | null;

let originalFetch: OriginalFetch = null;

export function getOriginalFetch(): OriginalFetch {
  return originalFetch;
}

export function setOriginalFetch(value: OriginalFetch) {
  originalFetch = value;
}
