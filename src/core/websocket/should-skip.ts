import type { NetworkFilters } from "../../types";
import { isDevServerHost } from "../system";
import { isExcludedByFilters } from "../../utils";

export function shouldSkipWs(
  url: string,
  host: string,
  path: string,
  filters: NetworkFilters
): boolean {
  // Metro HMR / debugger sockets
  if (isDevServerHost(host)) return true;

  return isExcludedByFilters(url, host, path, filters);
}
