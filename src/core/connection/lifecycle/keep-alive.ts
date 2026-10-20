import { setPromptDefaults } from "../prompt";
import { loadLastConnection } from "../session";
import type { HeimdallConnectOptions } from "../../../types";
import { setSdkEnabled, resolveEnabled } from "../sdk-enabled";
import { setupEarlyEvents } from "./early-events";
import { connect, connectToCloudTarget } from "./connect";
import { registerCloudUrl } from "../../cloud/state";
import { createCloudResolver } from "../resolver";

async function reconnectThroughCloud({
  defaults,
  baseUrl,
}: {
  defaults: Omit<HeimdallConnectOptions, "channel">;
  baseUrl: string;
}) {
  try {
    const target = await createCloudResolver({ baseUrl }).resolve();
    if (target) connectToCloudTarget({ defaults, target });
  } catch {
    // stay disconnected: the prompt offers Connect
  }
}

/**
 * Configure connect prompt + captureEarlyEvents + keepAlive.
 */
export function configureConnectPrompt(
  defaults: Omit<HeimdallConnectOptions, "channel">
) {
  const { captureEarlyEvents, keepAlive, enabled, ...rest } =
    defaults as HeimdallConnectOptions & {
      captureEarlyEvents?: boolean;
      keepAlive?: boolean;
    };

  const resolvedEnabled = resolveEnabled(enabled);

  if (!resolvedEnabled) {
    setSdkEnabled(false);
    return;
  }

  setSdkEnabled(true);
  registerCloudUrl(rest.cloud?.url);

  setPromptDefaults({
    ...rest,
    enabled: resolvedEnabled,
  });

  // early collection (before connect), if needed
  if (captureEarlyEvents) {
    setupEarlyEvents(rest);
  }

  // keepAlive: auto-connect, if there is a last connection
  if (keepAlive) {
    const last = loadLastConnection();
    if (last?.source === "cloud") {
      if (rest.cloud?.url) {
        void reconnectThroughCloud({
          defaults: { ...rest, enabled: resolvedEnabled },
          baseUrl: rest.cloud.url,
        });
      }
    } else if (last && last.host && last.port && last.channel) {
      connect({
        ...rest,
        ...last,
        channel: last.channel!,
        enabled: resolvedEnabled,
      });
    }
  }
}
