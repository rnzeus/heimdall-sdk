import { Linking } from "react-native";

import type { InstallDevice } from "../system";
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
  installId,
  device,
  isCancelled,
}: {
  baseUrl: string;
  appId?: string;
  platform?: string;
  installId?: string;
  device?: InstallDevice;
  isCancelled: () => boolean;
}): Promise<LinkDeviceResult> {
  const claim = await createClaim({
    baseUrl,
    appId,
    platform,
    installId,
    device,
  });
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
