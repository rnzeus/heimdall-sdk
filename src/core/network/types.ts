export type NetworkEventPayload = {
  type: "network";
  transport: "fetch" | "axios";
  requestId: string;
  tsStart: number;
  tsEnd: number;
  method: string;
  url: string;
  host: string;
  path: string;
  status?: number;
  ok: boolean;
  durationMs: number;
  error?: string;

  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBodySnippet: string | undefined;
  responseBodySnippet: string | undefined;
  requestBodySize: number | undefined;
  responseBodySize: number | undefined;
  requestContentType: string | undefined;
  responseContentType: string | undefined;
};

export type NetworkFilters = {
  allowedHosts?: (string | RegExp)[];
  ignoreUrls?: (string | RegExp)[];
};
