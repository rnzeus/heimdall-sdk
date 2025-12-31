import { getOriginalWebSocket, setOriginalWebSocket, setWsFilters, setWsPatched } from "./state";

export function restoreWebSocket() {
  const g: any = globalThis as any;

  setWsPatched(false);
  setWsFilters({});

  const Original = getOriginalWebSocket();
  if (Original) {
    try {
      g.WebSocket = Original;
    } catch {
      // ignore
    }
  }

  setOriginalWebSocket(null);
}


