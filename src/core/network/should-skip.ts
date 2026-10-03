import type { NetworkFilters } from "../../types";
import { isCloudHost } from "../cloud/state";

function matchList(value: string, list?: (string | RegExp)[]): boolean {
  if (!list || list.length === 0) return false;
  return list.some((rule) =>
    typeof rule === "string" ? value === rule : rule.test(value)
  );
}

export function shouldSkip(
  url: string,
  host: string,
  path: string,
  filters: NetworkFilters
): boolean {
  if (isCloudHost(host)) return true;

  if (host.startsWith("localhost")) {
    if (
      path.startsWith("/symbolicate") ||
      path.startsWith("/open-debugger") ||
      path.startsWith("/onchange")
    ) {
      return true;
    }
  }

  if (
    matchList(url, filters.ignoreUrls) ||
    matchList(path, filters.ignoreUrls)
  ) {
    return true;
  }

  if (filters.allowedHosts && filters.allowedHosts.length > 0) {
    if (!matchList(host, filters.allowedHosts)) {
      return true;
    }
  }

  return false;
}
