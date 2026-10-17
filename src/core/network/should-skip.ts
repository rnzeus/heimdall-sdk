import type { NetworkFilters } from "../../types";
import { isCloudHost } from "../cloud/state";
import { isDevServerHost } from "../system";
import { isExcludedByFilters } from "../../utils";

export function shouldSkip(
  url: string,
  host: string,
  path: string,
  filters: NetworkFilters
): boolean {
  if (isCloudHost(host)) return true;
  if (isDevServerHost(host)) return true;

  if (host.startsWith("localhost")) {
    if (
      path.startsWith("/symbolicate") ||
      path.startsWith("/open-debugger") ||
      path.startsWith("/onchange")
    ) {
      return true;
    }
  }

  return isExcludedByFilters(url, host, path, filters);
}
