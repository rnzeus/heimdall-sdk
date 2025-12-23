import { setPromptDefaults } from "../prompt";
import { loadLastConnection } from "../session";
import type { HeimdallConnectOptions } from "../../../types";
import { setSdkEnabled, resolveEnabled } from "../sdk-enabled";
import { setupEarlyEvents } from "./early-events";
import { connect } from "./connect";

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
    if (last && last.host && last.port && last.channel) {
      connect({
        ...rest,
        ...last,
        channel: last.channel!,
        enabled: resolvedEnabled,
      });
    }
  }
}
