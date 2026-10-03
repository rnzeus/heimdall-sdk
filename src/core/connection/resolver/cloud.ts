import {
  CloudUnauthorizedError,
  clearCloudDevice,
  fetchConnection,
  loadCloudDevice,
} from "../../cloud";
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
        return {
          host: connection.host,
          port: connection.port,
          channel: connection.channel,
          hostName: connection.hostName,
        };
      } catch (error) {
        if (error instanceof CloudUnauthorizedError) clearCloudDevice();
        throw error;
      }
    },
  };
}
