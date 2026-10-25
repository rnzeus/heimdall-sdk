import { shouldSkip } from "./should-skip";
import { generateRandomId, parseUrl } from "../../utils";
import { sendEvent } from "../connection";
import type { NetworkEventPayload, NetworkFilters, NetworkStartEventPayload } from "../../types";
import type { HeadersMap, Meta, XHR } from "./xhr-types";
import {
  normaliseHeaderName,
  normaliseResponseHeaders,
} from "./headers";
import { buildBodySnippet, debugLog } from "../../utils";
import { nextXhrIndex } from "./xhr-runtime-state";
import { readRNBlobAsText } from "./rn-blob";
import { xhrError } from "./xhr-error";

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

    meta.responseHeaders = normaliseResponseHeaders(responseHeaders);
    meta.responseContentType = String(responseContentType ?? "");
    meta.responseSize = Number(responseSize ?? 0);
  };

  const sendCallback = (data: any, xhr: XHR) => {
    const meta = requests.get(xhr._index);
    if (!meta) return;

    const tsStart = Date.now();
    meta.tsStart = tsStart;
    meta.requestId = `${tsStart}-${Math.random().toString(16).slice(2)}`;

    // Lets the host show a request that is still waiting; the completion follows with the same requestId.
    const start: NetworkStartEventPayload = {
      id: generateRandomId(),
      type: "networkStart",
      transport: "xhr",
      requestId: meta.requestId,
      tsStart,
      method: meta.method,
      url: meta.url,
      host: meta.host,
      path: meta.path,
      requestHeaders: { ...meta.requestHeaders },
      requestContentType: meta.requestHeaders["content-type"],
    };
    sendEvent(start);

    const requestContentType = meta.requestHeaders["content-type"];
    const reqBody = buildBodySnippet(data, { contentType: requestContentType });
    meta.requestBodySnippet = reqBody.snippet;
    meta.requestBodySize = reqBody.sizeBytes;
    meta.requestBodySnippetBytes = reqBody.snippetBytes;
    meta.requestBodyTruncated = reqBody.truncated;

    if (reqBody.isBlob) {
      meta.__requestBlob = data;
    } else {
      meta.__requestBlob = undefined;
    }
  };

  const responseCallback = (
    status: number,
    _timeout: number,
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
      meta.responseHeaders && Object.keys(meta.responseHeaders).length > 0
        ? meta.responseHeaders
        : xhr.responseHeaders
          ? normaliseResponseHeaders(xhr.responseHeaders)
          : {};

    const responseContentType =
      meta.responseContentType || responseHeaders["content-type"];

    const resBody = buildBodySnippet(response, {
      contentType: responseContentType,
    });
    let responseBodySnippet = resBody.snippet;
    let responseBodySize = resBody.sizeBytes;
    let responseBodySnippetBytes = resBody.snippetBytes;
    let responseBodyTruncated = resBody.truncated;

    if (resBody.isBlob) {
      meta.__responseBlob = response;
    } else {
      meta.__responseBlob = undefined;
    }

    const basePayload: Omit<
      NetworkEventPayload,
      | "requestBodySnippet"
      | "requestBodySnippetBytes"
      | "requestBodyTruncated"
      | "requestBodySize"
      | "responseBodySnippet"
      | "responseBodySnippetBytes"
      | "responseBodyTruncated"
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
      error: xhrError(xhr, ok),
      requestHeaders: meta.requestHeaders,
      responseHeaders,
      requestContentType: meta.requestHeaders["content-type"],
      responseContentType,
    };

    const finalizeAndSend = async () => {
      if (meta.__requestBlob) {
        try {
          const txt = await readRNBlobAsText(meta.__requestBlob);
          const reqBody = buildBodySnippet(txt, {
            contentType: meta.requestHeaders["content-type"],
          });
          meta.requestBodySnippet = reqBody.snippet;
          meta.requestBodySize = reqBody.sizeBytes;
          meta.requestBodySnippetBytes = reqBody.snippetBytes;
          meta.requestBodyTruncated = reqBody.truncated;
        } catch {
          // ignore
        }
      }

      if (meta.__responseBlob) {
        try {
          const txt = await readRNBlobAsText(meta.__responseBlob);
          const resBody = buildBodySnippet(txt, {
            contentType: responseContentType,
          });
          responseBodySnippet = resBody.snippet;
          responseBodySize = resBody.sizeBytes;
          responseBodySnippetBytes = resBody.snippetBytes;
          responseBodyTruncated = resBody.truncated;
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
        requestBodySnippetBytes: meta.requestBodySnippetBytes,
        responseBodySnippetBytes,
        requestBodyTruncated: meta.requestBodyTruncated,
        responseBodyTruncated,
      };

      debugLog(
        "network",
        `sendEvent: ${meta.method} ${meta.url} status=${status} ok=${ok}`
      );
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
