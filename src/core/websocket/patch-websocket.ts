import type { NetworkFilters, WsEventPayload } from "../../types";
import { generateRandomId, parseUrl } from "../../utils";
import { sendEvent } from "../connection";
import { buildBodySnippet, debugLog, tryMinifyJsonString } from "../../utils";
import {
  getWsFilters,
  getOriginalWebSocket,
  isWsPatched,
  setOriginalWebSocket,
  setWsFilters,
  setWsPatched,
} from "./state";
import { shouldSkipWs } from "./should-skip";

type WsMeta = {
  connectionId: string;
  url: string;
};

const wsMeta = new WeakMap<WebSocket, WsMeta>();

function now() {
  return Date.now();
}

function previewString(s: string, max = 200): string {
  const out = s.length > max ? s.slice(0, max) + "…" : s;
  return out.replace(/\s+/g, " ");
}

function looksLikeJsonText(s: string): boolean {
  const t = s.trim();
  return t.startsWith("{") || t.startsWith("[");
}

function guessContentType(data: any): string | undefined {
  if (typeof data === "string") {
    if (!looksLikeJsonText(data)) return "text/plain";

    // Only mark as JSON if it's actually valid JSON (otherwise JSON viewers will fail).
    // Also avoid JSON.parse on huge frames.
    if (data.length > 1_000_000) return "text/plain";
    return tryMinifyJsonString(data) ? "application/json" : "text/plain";
  }
  return undefined;
}

function buildWsFrame(
  meta: WsMeta,
  direction: "in" | "out",
  data: any
): Pick<
  WsEventPayload,
  | "direction"
  | "dataSnippet"
  | "dataSnippetBytes"
  | "dataTruncated"
  | "dataSize"
  | "dataContentType"
> {
  // Default path: treat as text if string, else describe as binary/unknown.
  if (typeof data === "string") {
    const ct = guessContentType(data);
    const r = buildBodySnippet(data, { contentType: ct });
    return {
      direction,
      dataSnippet: r.snippet,
      dataSnippetBytes: r.snippetBytes,
      dataTruncated: r.truncated,
      dataSize: r.sizeBytes,
      dataContentType: ct,
    };
  }

  // ArrayBuffer / TypedArray
  const byteLen =
    data instanceof ArrayBuffer
      ? data.byteLength
      : ArrayBuffer.isView(data)
      ? data.byteLength
      : undefined;

  if (typeof byteLen === "number") {
    const snippet = `[binary ${byteLen} bytes]`;
    const r = buildBodySnippet(snippet, { contentType: "text/plain" });
    return {
      direction,
      dataSnippet: r.snippet,
      dataSnippetBytes: r.snippetBytes,
      dataTruncated: false,
      dataSize: byteLen,
      dataContentType: "application/octet-stream",
    };
  }

  // RN Blob-like: buildBodySnippet will return placeholder + isBlob, but content type is unknown.
  const r = buildBodySnippet(data, { contentType: undefined });
  return {
    direction,
    dataSnippet: r.snippet,
    dataSnippetBytes: r.snippetBytes,
    dataTruncated: r.truncated,
    dataSize: r.sizeBytes,
    dataContentType: undefined,
  };
}

function sendWsEvent(payload: WsEventPayload) {
  sendEvent(payload);
}

export function patchWebSocket(options?: NetworkFilters) {
  debugLog(
    "ws",
    `patchWebSocket called, allowedHosts=${JSON.stringify(
      options?.allowedHosts
    )}, ignoreUrls=${JSON.stringify(options?.ignoreUrls)}`
  );

  const g: any = globalThis as any;
  const CurrentWS: any = g.WebSocket;
  if (typeof CurrentWS === "undefined") return false;

  setWsFilters({
    allowedHosts: options?.allowedHosts,
    ignoreUrls: options?.ignoreUrls,
  });

  if (isWsPatched()) return true;
  setWsPatched(true);

  const Original = getOriginalWebSocket() ?? CurrentWS;
  setOriginalWebSocket(Original);

  debugLog("ws", "WebSocket patching in progress...");

  function PatchedWebSocket(this: any, ...args: any[]) {
    // RN WebSocket supports (url, protocols?, options?) — keep it generic and forward all args.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const ws: WebSocket = new Original(...(args as [any]));

    const urlArg = args.length > 0 ? args[0] : undefined;
    const fullUrl = String(urlArg ?? (ws as any).url ?? "");
    const { host, path } = parseUrl(fullUrl);
    const skipped = shouldSkipWs(fullUrl, host, path, getWsFilters());
    if (skipped) {
      return ws as any;
    }

    const meta: WsMeta = {
      connectionId: generateRandomId(),
      url: fullUrl,
    };
    wsMeta.set(ws, meta);
    debugLog("ws", `attach connectionId=${meta.connectionId} url=${meta.url}`);

    const attach = (
      type: "open" | "close" | "error" | "message",
      fn: (ev: any) => void
    ) => {
      const ael = (ws as any).addEventListener;
      if (typeof ael === "function") {
        ael.call(ws, type, fn);
        return;
      }

      // RN WebSocket frequently uses onopen/onmessage/onerror/onclose instead of addEventListener.
      const prop = `on${type}`;
      const prev = (ws as any)[prop];
      (ws as any)[prop] = (ev: any) => {
        try {
          fn(ev);
        } finally {
          try {
            if (typeof prev === "function") prev.call(ws, ev);
          } catch {
            // ignore
          }
        }
      };
    };

    // open
    attach("open", () => {
      debugLog("ws", `open connectionId=${meta.connectionId}`);
      debugLog(
        "ws",
        `sendEvent: open connectionId=${meta.connectionId} url=${meta.url}`
      );
      sendWsEvent({
        id: generateRandomId(),
        type: "ws",
        transport: "websocket",
        connectionId: meta.connectionId,
        ts: now(),
        url: meta.url,
        kind: "open",
      });
    });

    // close
    attach("close", (ev: any) => {
      debugLog(
        "ws",
        `close connectionId=${meta.connectionId} code=${String(
          ev?.code
        )} reason=${String(ev?.reason)}`
      );
      debugLog(
        "ws",
        `sendEvent: close connectionId=${meta.connectionId} code=${String(
          ev?.code
        )}`
      );
      sendWsEvent({
        id: generateRandomId(),
        type: "ws",
        transport: "websocket",
        connectionId: meta.connectionId,
        ts: now(),
        url: meta.url,
        kind: "close",
        code: typeof ev?.code === "number" ? ev.code : undefined,
        reason: typeof ev?.reason === "string" ? ev.reason : undefined,
      });
      wsMeta.delete(ws);
    });

    // error
    attach("error", (ev: any) => {
      const msg =
        (typeof ev?.message === "string" && ev.message) ||
        (typeof ev?.error?.message === "string" && ev.error.message) ||
        "websocket_error";
      debugLog("ws", `error connectionId=${meta.connectionId} msg=${msg}`);
      debugLog(
        "ws",
        `sendEvent: error connectionId=${meta.connectionId} msg=${msg}`
      );
      sendWsEvent({
        id: generateRandomId(),
        type: "ws",
        transport: "websocket",
        connectionId: meta.connectionId,
        ts: now(),
        url: meta.url,
        kind: "error",
        error: msg,
      });
    });

    // incoming frame
    attach("message", (ev: any) => {
      const frame = buildWsFrame(meta, "in", ev?.data);
      const raw =
        typeof ev?.data === "string" ? previewString(ev.data) : typeof ev?.data;
      debugLog(
        "ws",
        `frame(in) connectionId=${meta.connectionId} bytes=${String(
          frame.dataSize ?? frame.dataSnippetBytes ?? "?"
        )} truncated=${String(frame.dataTruncated)} ct=${String(
          frame.dataContentType
        )} data=${String(raw)}`
      );
      debugLog(
        "ws",
        `sendEvent: frame(in) connectionId=${meta.connectionId} bytes=${String(
          frame.dataSize ?? frame.dataSnippetBytes
        )}`
      );
      sendWsEvent({
        id: generateRandomId(),
        type: "ws",
        transport: "websocket",
        connectionId: meta.connectionId,
        ts: now(),
        url: meta.url,
        kind: "frame",
        ...frame,
      });
    });

    // outgoing frame
    const originalSend = (ws as any).send;
    if (typeof originalSend === "function") {
      (ws as any).send = function patchedSend(data: any) {
        const m = wsMeta.get(ws);
        if (m) {
          const frame = buildWsFrame(m, "out", data);
          const raw =
            typeof data === "string" ? previewString(data) : typeof data;
          debugLog(
            "ws",
            `frame(out) connectionId=${m.connectionId} bytes=${String(
              frame.dataSize ?? frame.dataSnippetBytes ?? "?"
            )} truncated=${String(frame.dataTruncated)} ct=${String(
              frame.dataContentType
            )} data=${String(raw)}`
          );
          debugLog(
            "ws",
            `sendEvent: frame(out) connectionId=${
              m.connectionId
            } bytes=${String(frame.dataSize ?? frame.dataSnippetBytes)}`
          );
          sendWsEvent({
            id: generateRandomId(),
            type: "ws",
            transport: "websocket",
            connectionId: m.connectionId,
            ts: now(),
            url: m.url,
            kind: "frame",
            ...frame,
          });
        }
        return originalSend.call(ws, data);
      };
    }

    return ws as any;
  }

  // Preserve prototype + statics (CONNECTING/OPEN/CLOSING/CLOSED etc.)
  (PatchedWebSocket as any).prototype = Original.prototype;
  try {
    Object.setPrototypeOf(PatchedWebSocket, Original);
  } catch {
    // ignore
  }
  try {
    Object.assign(PatchedWebSocket, Original);
  } catch {
    // ignore
  }

  g.WebSocket = PatchedWebSocket as any;
  debugLog("ws", "WebSocket patched successfully");
  return true;
}
