import type { HelloCapabilities } from "@rnzeus/heimdall-protocol";

let capabilities: HelloCapabilities = {};

/** Optional features announced in `hello`; set by the feature when the app turns it on. */
export function setCapability<K extends keyof HelloCapabilities>({
  name,
  value,
}: {
  name: K;
  value: HelloCapabilities[K];
}) {
  capabilities = { ...capabilities, [name]: value };
}

export function getCapabilities(): HelloCapabilities | undefined {
  return Object.keys(capabilities).length > 0 ? capabilities : undefined;
}
