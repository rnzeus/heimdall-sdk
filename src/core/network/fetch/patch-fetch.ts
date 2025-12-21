import { getFilters, isPatched, setFilters, setPatched } from "../state";
import { shouldSkip } from "../utils";
import { getOriginalFetch, setOriginalFetch } from "./state";
import { NETWORK } from "../constants";
import { generateRandomId, parseUrl } from "../../../utils";
import { sendEvent } from "../../connection";
import type { NetworkEventPayload, NetworkFilters } from "../../connection";

export function patchFetch(options?: NetworkFilters) {
  if (!globalThis.fetch) return;

  setFilters({
    allowedHosts: options?.allowedHosts,
    ignoreUrls: options?.ignoreUrls,
  });

  if (isPatched()) return;
  setPatched(true);

  setOriginalFetch(globalThis.fetch);

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

    if (shouldSkip(url, host, path, getFilters())) {
      return getOriginalFetch()!(input as any, init as any);
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
          requestBodySnippet = init.body.slice(0, NETWORK.MAX_BODY_LENGTH);
          requestBodySize = init.body.length;
        } else if (init.body instanceof URLSearchParams) {
          const txt = init.body.toString();
          requestBodySnippet = txt.slice(0, NETWORK.MAX_BODY_LENGTH);
          requestBodySize = txt.length;
        }
        // NOTE: FormData / Blob / ArrayBuffer — we can add it later
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
      res = await getOriginalFetch()!(input as any, init as any);

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

        responseBodySnippet = text.slice(0, NETWORK.MAX_BODY_LENGTH);
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
      const payload: NetworkEventPayload = {
        id: generateRandomId(),
        type: "network",
        transport: "fetch",
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

      sendEvent(payload);
    }

    return res!;
  };
}
