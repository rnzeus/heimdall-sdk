import type { ConnectionResolver, ConnectionTarget } from "./types";

export function createManualResolver(
  target: ConnectionTarget
): ConnectionResolver {
  return { resolve: async () => target };
}
