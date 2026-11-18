import type { ConnectionSource } from "../session";

/**
 * Why a connection to the host failed, with the address and where it came from: an old address from the cloud,
 * an old one typed by hand and a phone that can't see the computer look alike otherwise. The system's reason
 * stays in the text, the iOS Local Network check reads it.
 */
export function unreachableMessage({
  host,
  port,
  source,
  reason,
}: {
  host: string;
  port: number;
  source: ConnectionSource;
  reason: string;
}): string {
  const hint =
    source === "manual"
      ? "Same Wi-Fi, no VPN? The address may have changed: see Heimdall → Settings → Connection."
      : "Same Wi-Fi as the computer, no VPN?";
  return `Can't reach Heimdall at ${host}:${port} (${source}): ${reason.replace(/\.$/, "")}. ${hint}`;
}
