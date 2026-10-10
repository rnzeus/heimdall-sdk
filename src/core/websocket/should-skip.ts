import type { NetworkFilters } from "../../types";
import { isDevServerHost } from "../system";

function matchList(value: string, list?: (string | RegExp)[]): boolean {
  if (!list || list.length === 0) return false;
  return list.some((rule) =>
    typeof rule === "string" ? value === rule : rule.test(value)
  );
}

export function shouldSkipWs(
  url: string,
  host: string,
  path: string,
  filters: NetworkFilters
): boolean {
  // Metro HMR / debugger sockets
  if (isDevServerHost(host)) return true;

  // ignoreUrls
  if (matchList(url, filters.ignoreUrls) || matchList(path, filters.ignoreUrls)) {
    return true;
  }

  // allowedHosts
  if (filters.allowedHosts && filters.allowedHosts.length > 0) {
    if (!matchList(host, filters.allowedHosts)) {
      return true;
    }
  }

  return false;
}


