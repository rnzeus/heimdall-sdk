/* eslint-disable @typescript-eslint/no-explicit-any */

import { sendNetworkEvent } from "./socket";
import type { NetworkWireEventPayload } from "./protocol";

let originalFetch: typeof fetch | null = null;
let patched = false;

type Filters = {
  allowedHosts?: (string | RegExp)[];
  ignoreUrls?: (string | RegExp)[];
};

let filters: Filters = {};

const MAX_BODY_LENGTH = 50_000; // 50 KB — optimal limit

function parseUrl(url: string) {
  try {
    const u = new URL(url);
    return {
      url,
      host: u.host,
      path: u.pathname + u.search,
    };
  } catch {
    return {
      url,
      host: "",
      path: url,
    };
  }
}

function matchList(value: string, list?: (string | RegExp)[]): boolean {
  if (!list || list.length === 0) return false;
  return list.some((rule) =>
    typeof rule === "string" ? value === rule : rule.test(value)
  );
}

function shouldSkip(url: string, host: string, path: string): boolean {
  // 1) Built-in ignore for RN dev services
  if (host.startsWith("localhost")) {
    if (
      path.startsWith("/symbolicate") ||
      path.startsWith("/open-debugger") ||
      path.startsWith("/onchange")
    ) {
      return true;
    }
  }

  // 2) ignoreUrls
  if (
    matchList(url, filters.ignoreUrls) ||
    matchList(path, filters.ignoreUrls)
  ) {
    return true;
  }

  // 3) allowedHosts
  if (filters.allowedHosts && filters.allowedHosts.length > 0) {
    if (!matchList(host, filters.allowedHosts)) {
      return true;
    }
  }

  return false;
}

export function patchFetch(options?: Filters) {
  if (!globalThis.fetch) return;

  filters.allowedHosts = options?.allowedHosts;
  filters.ignoreUrls = options?.ignoreUrls;

  if (patched) return;
  patched = true;

  originalFetch = globalThis.fetch;

  globalThis.fetch = async function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const tsStart = Date.now();
    let url: string;

    if (typeof input === "string") {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = (input as Request).url;
    }

    const { host, path } = parseUrl(url);

    if (shouldSkip(url, host, path)) {
      return originalFetch!(input as any, init as any);
    }

    const requestId = `${tsStart}-${Math.random().toString(16).slice(2)}`;
    const method = (init?.method || "GET").toUpperCase();

    /** --------------------------
     *   REQUEST HEADERS
     * ------------------------- */
    const requestHeaders: Record<string, string> = {};

    try {
      if (init?.headers) {
        const h = new Headers(init.headers as any);
        h.forEach((value, key) => {
          requestHeaders[key] = value;
        });
      }
    } catch {
      // ignore
    }

    /** --------------------------
     *   REQUEST BODY
     * ------------------------- */
    let requestBodySnippet: string | undefined;
    let requestBodySize: number | undefined;

    try {
      if (init?.body) {
        if (typeof init.body === "string") {
          requestBodySnippet = init.body.slice(0, MAX_BODY_LENGTH);
          requestBodySize = init.body.length;
        } else if (init.body instanceof URLSearchParams) {
          const txt = init.body.toString();
          requestBodySnippet = txt.slice(0, MAX_BODY_LENGTH);
          requestBodySize = txt.length;
        }
        // NOTE: FormData / Blob / ArrayBuffer — можно добавить позже
      }
    } catch {
      // ignore
    }

    /** --------------------------
     *   RESPONSE
     * ------------------------- */
    let res: Response;
    let error: any = null;
    let status: number | undefined;
    let ok = false;
    let tsEnd = tsStart;

    let responseHeaders: Record<string, string> = {};
    let responseBodySnippet: string | undefined;
    let responseBodySize: number | undefined;
    let responseContentType: string | undefined;

    try {
      res = await originalFetch!(input as any, init as any);

      status = res.status;
      ok = res.status >= 200 && res.status < 300;
      tsEnd = Date.now();

      // --- response headers
      res.headers?.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      responseContentType = responseHeaders["content-type"];

      // --- response body (safe clone)
      try {
        const cloned = res.clone();
        const text = await cloned.text();

        responseBodySnippet = text.slice(0, MAX_BODY_LENGTH);
        responseBodySize = text.length;
      } catch {
        // ignore body errors
      }
    } catch (e) {
      error = e;
      tsEnd = Date.now();
      ok = false;
      throw e;
    } finally {
      /** --------------------------
       *   SEND EVENT
       * ------------------------- */
      const payload: NetworkWireEventPayload = {
        type: "fetch",
        requestId,
        tsStart,
        tsEnd,
        method,
        url,
        host,
        path,
        status,
        ok,
        durationMs: tsEnd - tsStart,
        error: error ? (error as any)?.message ?? "fetch_error" : undefined,

        requestHeaders,
        responseHeaders,
        requestBodySnippet,
        responseBodySnippet,
        requestBodySize,
        responseBodySize,
        requestContentType: requestHeaders["content-type"],
        responseContentType,
      };

      sendNetworkEvent(payload);
    }

    return res!;
  };
}

export function restoreFetch() {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
    originalFetch = null;
  }
  patched = false;
  filters = {};
}
