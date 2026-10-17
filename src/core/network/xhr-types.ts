import type { XHRInterceptorModule } from "./get-interceptor";

export type HeadersMap = Record<string, string>;

export type XHR = {
  _index: number;
  responseHeaders?: HeadersMap;
  /** React Native XMLHttpRequest internals; still set when the interceptor reports DONE. */
  _aborted?: boolean;
  _timedOut?: boolean;
};

export type Meta = {
  tsStart: number;
  requestId: string;
  method: string;
  url: string;
  host: string;
  path: string;

  requestHeaders: HeadersMap;
  requestBodySnippet?: string;
  requestBodySize?: number;
  requestBodySnippetBytes?: number;
  requestBodyTruncated?: boolean;

  responseHeaders?: HeadersMap;
  responseContentType?: string;
  responseSize?: number;
  responseURL?: string;
  responseType?: string;
  responseBodySnippetBytes?: number;
  responseBodyTruncated?: boolean;

  __requestBlob?: any;
  __responseBlob?: any;
};

export type HeimdallXhrState = {
  enabled: boolean;
  interceptor: XHRInterceptorModule;
  requests: Map<number, Meta>;
};
