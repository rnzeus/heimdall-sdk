import { setFilters, setPatched } from "../state";
import { getOriginalFetch, setOriginalFetch } from "./state";

export function restoreFetch() {
  const originalFetch = getOriginalFetch();
  if (originalFetch) {
    globalThis.fetch = originalFetch;
    setOriginalFetch(null);
  }
  setPatched(false);
  setFilters({});
}
