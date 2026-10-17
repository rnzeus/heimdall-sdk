import type { XHR } from "./xhr-types";

/**
 * Status 0 alone cannot tell an abort from a network failure, so read the
 * XHR flags. The interceptor's `timeout` argument is the configured timeout,
 * not a sign that it fired.
 */
export function xhrError(xhr: XHR, ok: boolean): string | undefined {
  if (xhr._aborted) return "xhr_aborted";
  if (xhr._timedOut) return "xhr_timeout";
  return ok ? undefined : "xhr_error";
}
