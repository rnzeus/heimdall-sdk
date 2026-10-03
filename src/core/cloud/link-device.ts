import { Linking } from "react-native";

import { createClaim, pollClaim } from "./client";
import { saveCloudDevice } from "./storage";

const POLL_INTERVAL_MS = 2_000;

export type LinkDeviceResult =
  | { status: "linked"; deviceName: string }
  | { status: "expired" }
  | { status: "cancelled" };

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

export async function linkDevice({
  baseUrl,
  appId,
  platform,
  isCancelled,
}: {
  baseUrl: string;
  appId?: string;
  platform?: string;
  isCancelled: () => boolean;
}): Promise<LinkDeviceResult> {
  const claim = await createClaim({ baseUrl, appId, platform });
  await Linking.openURL(claim.url);

  while (Date.now() < claim.expiresAt) {
    await delay(POLL_INTERVAL_MS);
    if (isCancelled()) return { status: "cancelled" };

    let result;
    try {
      result = await pollClaim({ baseUrl, code: claim.code });
    } catch {
      continue;
    }
    if (result.status === "expired") return { status: "expired" };
    if (result.status === "approved") {
      saveCloudDevice({ token: result.token, name: result.device.name });
      return { status: "linked", deviceName: result.device.name };
    }
  }

  return { status: "expired" };
}
