import { getFilters, isPatched, setFilters, setPatched } from "./state";
import type { NetworkFilters } from "../../types";
import { loadTryGetXHRInterceptorModule } from "./get-interceptor";
import { createXhrCallbacks } from "./xhr-callbacks";
import { getOrCreateHeimdallXhrState } from "./xhr-runtime-state";

export function patchXHR(options?: NetworkFilters) {
  if (typeof XMLHttpRequest === "undefined") return false;

  setFilters({
    allowedHosts: options?.allowedHosts,
    ignoreUrls: options?.ignoreUrls,
  });

  if (isPatched()) return;
  setPatched(true);

  const XHRInterceptor = loadTryGetXHRInterceptorModule();
  if (!XHRInterceptor) {
    setPatched(false);
    return false;
  }

  const state = getOrCreateHeimdallXhrState(XHRInterceptor);

  if (state.enabled || state.interceptor.isInterceptorEnabled()) {
    state.enabled = true;
    return;
  }

  const {
    openCallback,
    requestHeadersCallback,
    headerReceivedCallback,
    sendCallback,
    responseCallback,
  } = createXhrCallbacks({
    requests: state.requests,
    getFilters,
  });

  state.interceptor.setOpenCallback(openCallback);
  state.interceptor.setRequestHeaderCallback(requestHeadersCallback);
  state.interceptor.setHeaderReceivedCallback(headerReceivedCallback);
  state.interceptor.setSendCallback(sendCallback);
  state.interceptor.setResponseCallback(responseCallback);

  state.interceptor.enableInterception();
  state.enabled = true;

  return true;
}
