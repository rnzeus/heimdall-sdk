import { shouldSkip } from "./should-skip";
import { NETWORK } from "./constants";
import { generateRandomId, parseUrl } from "../../utils";
import { sendEvent } from "../connection";
import type { NetworkEventPayload, NetworkFilters } from "../../types";
import type { HeadersMap, Meta, XHR } from "./xhr-types";
import { normaliseHeaderName, normaliseHeaders } from "./headers";
import { safeBodySnippet, tryPrettifyJsonString } from "./body-snippet";
import { nextXhrIndex } from "./xhr-runtime-state";
import { readRNBlobAsText } from "./rn-blob";

export function createXhrCallbacks(deps: {
  requests: Map<number, Meta>;
  getFilters: () => NetworkFilters;
}) {
  const { requests, getFilters } = deps;

  const openCallback = (method: string, url: string, xhr: XHR) => {
    const fullUrl = String(url ?? "");
    const { host, path } = parseUrl(fullUrl);

    if (shouldSkip(fullUrl, host, path, getFilters())) {
      return;
    }

    xhr._index = nextXhrIndex();

    const meta: Meta = {
      tsStart: 0,
      requestId: "",
      method: String(method || "GET").toUpperCase(),
      url: fullUrl,
      host,
      path,
      requestHeaders: {},
    };

    requests.set(xhr._index, meta);
  };

  const requestHeadersCallback = (header: string, value: string, xhr: XHR) => {
    const meta = requests.get(xhr._index);
    if (!meta) return;

    const key = normaliseHeaderName(header);
    if (!key) return;

    if (value == null) return;
    meta.requestHeaders[key] = String(value);
  };

  const headerReceivedCallback = (
    responseContentType: string,
    responseSize: number,
    responseHeaders: HeadersMap,
    xhr: XHR
  ) => {
    const meta = requests.get(xhr._index);
    if (!meta) return;

    meta.responseHeaders = normaliseHeaders(responseHeaders);
    meta.responseContentType = String(responseContentType ?? "");
    meta.responseSize = Number(responseSize ?? 0);
  };

  const sendCallback = (data: any, xhr: XHR) => {
    const meta = requests.get(xhr._index);
    if (!meta) return;

    const tsStart = Date.now();
    meta.tsStart = tsStart;
    meta.requestId = `${tsStart}-${Math.random().toString(16).slice(2)}`;

    const reqBody = safeBodySnippet(data);
    meta.requestBodySnippet = reqBody.snippet;
    meta.requestBodySize = reqBody.size;

    if (reqBody.isBlob) {
      meta.__requestBlob = data;
    } else {
      meta.__requestBlob = undefined;
    }
  };

  const responseCallback = (
    status: number,
    timeout: number,
    response: any,
    responseURL: string,
    responseType: string,
    xhr: XHR
  ) => {
    const meta = requests.get(xhr._index);
    if (!meta) return;

    meta.responseURL = responseURL;
    meta.responseType = responseType;

    const tsEnd = Date.now();
    const ok = typeof status === "number" && status >= 200 && status < 300;

    const responseHeaders: HeadersMap =
      meta.responseHeaders ??
      (xhr.responseHeaders ? normaliseHeaders(xhr.responseHeaders) : {});

    const responseContentType =
      meta.responseContentType || responseHeaders["content-type"];

    const resBody = safeBodySnippet(response);
    let responseBodySnippet = resBody.snippet;
    let responseBodySize = resBody.size;

    if (resBody.isBlob) {
      meta.__responseBlob = response;
    } else {
      meta.__responseBlob = undefined;
    }

    const basePayload: Omit<
      NetworkEventPayload,
      | "requestBodySnippet"
      | "requestBodySize"
      | "responseBodySnippet"
      | "responseBodySize"
    > = {
      id: generateRandomId(),
      type: "network",
      transport: "xhr",
      requestId: meta.requestId || `${tsEnd}-unknown`,
      tsStart: meta.tsStart || tsEnd,
      tsEnd,
      method: meta.method,
      url: meta.url,
      host: meta.host,
      path: meta.path,
      status: typeof status === "number" ? status : undefined,
      ok,
      durationMs: tsEnd - (meta.tsStart || tsEnd),
      error: timeout ? "xhr_timeout" : ok ? undefined : "xhr_error",
      requestHeaders: meta.requestHeaders,
      responseHeaders,
      requestContentType: meta.requestHeaders["content-type"],
      responseContentType,
    };

    const finalizeAndSend = async () => {
      if (meta.__requestBlob) {
        try {
          const txt = await readRNBlobAsText(meta.__requestBlob);
          const pretty = tryPrettifyJsonString(txt);
          const out = pretty ?? txt;
          meta.requestBodySnippet = out.slice(0, NETWORK.MAX_BODY_LENGTH);
          meta.requestBodySize = out.length;
        } catch {
          // ignore
        }
      }

      if (meta.__responseBlob) {
        try {
          const txt = await readRNBlobAsText(meta.__responseBlob);
          const pretty = tryPrettifyJsonString(txt);
          const out = pretty ?? txt;
          responseBodySnippet = out.slice(0, NETWORK.MAX_BODY_LENGTH);
          responseBodySize = out.length;
        } catch {
          // ignore
        }
      }

      const payload: NetworkEventPayload = {
        ...basePayload,
        requestBodySnippet: meta.requestBodySnippet,
        requestBodySize: meta.requestBodySize,
        responseBodySnippet,
        responseBodySize,
      };

      sendEvent(payload);
      requests.delete(xhr._index);
    };

    void finalizeAndSend();
  };

  return {
    openCallback,
    requestHeadersCallback,
    headerReceivedCallback,
    sendCallback,
    responseCallback,
  };
}
