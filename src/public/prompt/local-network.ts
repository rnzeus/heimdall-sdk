/**
 * iOS asks “Find devices on local networks” on the first connection to a LAN address and fails that very
 * connection with “No route to host”. While the question may still be open, the prompt keeps trying instead.
 */
export const LOCAL_NETWORK = {
  /** how long the user may take to answer iOS */
  waitMs: 30_000,
  retryMs: 1_500,
  /** after this the user has most likely answered: say where to turn it on, and keep trying */
  hintAfterMs: 8_000,
  hint: "No access yet. If you tapped Don't Allow, turn it on in Settings → Privacy & Security → Local Network.",
  notice:
    "Allow “Local Network” in the iOS prompt: Heimdall connects right after.",
  denied:
    "Local Network access is off for this app: Settings → Privacy & Security → Local Network.",
};

/** POSIX texts of EHOSTUNREACH / ENETUNREACH, as iOS reports a connection the Local Network permission held back */
const NO_ROUTE =
  /no route to host|host is unreachable|network is unreachable|EHOSTUNREACH|ENETUNREACH/i;

export function shouldWaitForLocalNetwork({
  platform,
  error,
  startedAt,
  now,
}: {
  platform: string;
  error: string | null;
  /** when the user pressed Connect */
  startedAt: number;
  now: number;
}): boolean {
  return (
    platform === "ios" &&
    error !== null &&
    NO_ROUTE.test(error) &&
    now - startedAt < LOCAL_NETWORK.waitMs
  );
}

/** What the prompt says while it keeps trying: first the iOS question, then where to turn access on. */
export function localNetworkNotice({
  startedAt,
  now,
}: {
  startedAt: number;
  now: number;
}): string {
  return now - startedAt < LOCAL_NETWORK.hintAfterMs
    ? LOCAL_NETWORK.notice
    : LOCAL_NETWORK.hint;
}

/** after the wait: a “no route” on iOS most likely means the permission is off */
export function localNetworkError({
  platform,
  error,
}: {
  platform: string;
  error: string;
}): string {
  return platform === "ios" && NO_ROUTE.test(error)
    ? LOCAL_NETWORK.denied
    : error;
}
