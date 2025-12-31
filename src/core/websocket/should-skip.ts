import type { NetworkFilters } from "../../types";

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


