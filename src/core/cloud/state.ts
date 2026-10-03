import { parseUrl } from "../../utils";

type CloudTarget = { channel: string; hostName?: string };

let lastCloudTarget: CloudTarget | null = null;

export function setLastCloudTarget(target: CloudTarget | null) {
  lastCloudTarget = target;
}

export function getCloudHostName(channel: string | null): string | null {
  if (!channel || lastCloudTarget?.channel !== channel) return null;
  return lastCloudTarget.hostName ?? null;
}

const cloudHosts = new Set<string>();

/** SDK's own cloud requests are never reported to Heimdall. */
export function registerCloudUrl(url: string | undefined) {
  const host = url ? parseUrl(url).host : "";
  if (host) cloudHosts.add(host);
}

export function isCloudHost(host: string): boolean {
  return cloudHosts.has(host);
}
