import TcpSocket from "react-native-tcp-socket";

const PROBE_TIMEOUT_MS = 3_000;

export type ProbeAddress = (options: {
  host: string;
  port: number;
  timeoutMs: number;
  signal: AbortSignal;
}) => Promise<boolean>;

const probeTcp: ProbeAddress = ({ host, port, timeoutMs, signal }) =>
  new Promise((resolve) => {
    let socket: ReturnType<typeof TcpSocket.createConnection> | null = null;
    const finish = (reachable: boolean) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      try {
        socket?.removeAllListeners?.();
        socket?.destroy();
      } catch {
        // ignore
      }
      resolve(reachable);
    };
    const onAbort = () => finish(false);
    const timer = setTimeout(() => finish(false), timeoutMs);
    signal.addEventListener("abort", onAbort);
    try {
      socket = TcpSocket.createConnection({ host, port }, () => finish(true));
      socket.on("error", () => finish(false));
    } catch {
      finish(false);
    }
  });

/**
 * Opens a bare TCP connection to every address at once and returns the first one that
 * answers, or null. A host drops a connection that sends nothing without reporting it.
 */
export async function pickReachableAddress({
  addresses,
  port,
  timeoutMs = PROBE_TIMEOUT_MS,
  probe = probeTcp,
}: {
  addresses: string[];
  port: number;
  timeoutMs?: number;
  probe?: ProbeAddress;
}): Promise<string | null> {
  if (addresses.length < 2) return addresses[0] ?? null;

  const controller = new AbortController();
  return new Promise((resolve) => {
    let pending = addresses.length;
    for (const host of addresses) {
      probe({ host, port, timeoutMs, signal: controller.signal })
        .catch(() => false)
        .then((reachable) => {
          pending -= 1;
          if (reachable && !controller.signal.aborted) {
            controller.abort();
            resolve(host);
          } else if (pending === 0) {
            resolve(null);
          }
        });
    }
  });
}
