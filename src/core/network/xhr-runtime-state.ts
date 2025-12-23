import type { XHRInterceptorModule } from "./get-interceptor";
import type { HeimdallXhrState } from "./xhr-types";

let nextXHRId = 0;

export function nextXhrIndex(): number {
  return nextXHRId++;
}

export function getOrCreateHeimdallXhrState(
  interceptor: XHRInterceptorModule
): HeimdallXhrState {
  const g: any = globalThis as any;
  if (!g.__heimdallXhrState) {
    g.__heimdallXhrState = {
      enabled: false,
      interceptor,
      requests: new Map(),
    } satisfies HeimdallXhrState;
  }

  return g.__heimdallXhrState as HeimdallXhrState;
}
