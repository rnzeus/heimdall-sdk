import { setFilters, setPatched } from "./state";
import { loadTryGetXHRInterceptorModule } from "./get-interceptor";
import type { HeimdallXhrState } from "./xhr-types";

export function restoreXHR() {
  const g: any = globalThis as any;

  setPatched(false);
  setFilters({});

  const state = g.__heimdallXhrState as HeimdallXhrState | undefined;

  const interceptor = state?.interceptor ?? loadTryGetXHRInterceptorModule();

  if (!interceptor) {
    delete g.__heimdallXhrState;
    return;
  }

  if (state?.requests) {
    try {
      state.requests.clear();
    } catch {
      // ignore
    }
  }

  const noop = () => null;

  try {
    interceptor.setOpenCallback(noop);
    interceptor.setRequestHeaderCallback(noop);
    interceptor.setHeaderReceivedCallback(noop);
    interceptor.setSendCallback(noop);
    interceptor.setResponseCallback(noop);
  } catch {
    // ignore
  }

  try {
    interceptor.disableInterception();
  } catch {
    // ignore
  }

  delete g.__heimdallXhrState;
}
