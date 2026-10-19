import type { HelloRejectReason } from "@rnzeus/heimdall-protocol";

/** Host certificate and session token from heimdall-cloud; kept in memory only. */
export type SecureTransport = {
  cert: string;
  pubkey: string;
  fingerprint256: string;
  token: string;
};

export type PeerCertificate = { pubkey?: string; fingerprint256?: string };

const REJECT_REASONS: readonly HelloRejectReason[] = [
  "auth",
  "channel",
  "version",
];

const PEER_POLL_ATTEMPTS = 30;
const PEER_POLL_INTERVAL_MS = 100;

/**
 * react-native-tcp-socket ignores `ca` on iOS, so the host is pinned here, before anything is sent:
 * iOS exposes the public key, Android the certificate fingerprint.
 */
export function matchesPin({
  peer,
  secure,
  platform,
}: {
  peer: PeerCertificate | null;
  secure: SecureTransport;
  platform: string;
}): boolean {
  if (!peer) return false;
  if (platform === "ios") return peer.pubkey === secure.pubkey;
  return peer.fingerprint256 === secure.fingerprint256;
}

/** Older react-native-tcp-socket reports `secureConnect` before the handshake ends. */
export async function readPeerCertificate(socket: {
  getPeerCertificate: () => unknown;
}): Promise<PeerCertificate | null> {
  for (let attempt = 0; attempt < PEER_POLL_ATTEMPTS; attempt++) {
    try {
      const peer =
        (await socket.getPeerCertificate()) as PeerCertificate | null;
      if (peer && (peer.pubkey || peer.fingerprint256)) return peer;
    } catch {
      // not ready yet
    }
    await new Promise<void>((resolve) =>
      setTimeout(() => resolve(), PEER_POLL_INTERVAL_MS)
    );
  }
  return null;
}

export type HostAnswer =
  { accepted: true } | { accepted: false; reason?: HelloRejectReason };

// Hand-written on purpose: the protocol schemas would pull zod into every consumer app. Mirrors the
// tolerant HelloAckWireMessageV1Schema: extra fields are ignored, an unknown reason becomes undefined.
export function parseHostAnswer(line: string): HostAnswer | null {
  let json: unknown;
  try {
    json = JSON.parse(line);
  } catch {
    return null;
  }
  if (!json || typeof json !== "object") return null;
  const { kind, v, status, reason } = json as Record<string, unknown>;
  if (kind !== "helloAck" || v !== 1) return null;
  if (status === "accepted") return { accepted: true };
  if (status !== "rejected") return null;
  return {
    accepted: false,
    reason: REJECT_REASONS.find((known) => known === reason),
  };
}

export function rejectionMessage(reason?: HelloRejectReason): string {
  switch (reason) {
    case "auth":
      return "Heimdall was restarted. Connect again.";
    case "version":
      return "This Heimdall is too old for the SDK. Update Heimdall.";
    case "channel":
      return "Heimdall is waiting for another device.";
    default:
      return "Heimdall refused the connection.";
  }
}

export const CERTIFICATE_MISMATCH =
  "Heimdall certificate does not match. Connect again from the prompt.";
export const NO_ANSWER = "Heimdall did not answer. Update Heimdall.";
