import {
  CloudUnauthorizedError,
  clearCloudDevice,
  fetchConnection,
  loadCloudDevice,
} from "../../cloud";
import { pickReachableAddress } from "./pick-reachable-address";
import type { ConnectionResolver } from "./types";

export function createCloudResolver({
  baseUrl,
}: {
  baseUrl: string;
}): ConnectionResolver {
  return {
    resolve: async () => {
      const device = loadCloudDevice();
      if (!device) return null;
      try {
        const connection = await fetchConnection({
          baseUrl,
          token: device.token,
        });
        if (!connection) return null;
        const reachable = await pickReachableAddress({
          addresses: connection.addresses,
          port: connection.port,
        });
        return {
          host: reachable ?? connection.host,
          port: connection.port,
          channel: connection.channel,
          hostName: connection.hostName,
          ...(connection.tls && connection.token
            ? { secure: { ...connection.tls, token: connection.token } }
            : {}),
        };
      } catch (error) {
        if (error instanceof CloudUnauthorizedError) clearCloudDevice();
        throw error;
      }
    },
  };
}
