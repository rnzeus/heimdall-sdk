import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearCloudDevice,
  linkDevice,
  loadCloudDevice,
  unlinkDevice,
} from "../../../core/cloud";
import {
  connectToCloudTarget,
  createCloudResolver,
  getOrCreateClientId,
  getPromptState,
} from "../../../core/connection";
import { readInstallDevice } from "../../../core/system";

type Phase = "idle" | "linking" | "connecting";

const useCloudView = ({
  baseUrl,
  visible,
  startConnecting,
}: {
  baseUrl: string;
  visible: boolean;
  startConnecting: (connectFn: () => void) => void;
}) => {
  const [deviceName, setDeviceName] = useState<string | null>(
    () => loadCloudDevice()?.name ?? null
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setDeviceName(loadCloudDevice()?.name ?? null);
      return;
    }
    cancelledRef.current = true;
    setMessage(null);
  }, [visible]);

  const onFindMe = useCallback(async () => {
    const defaults = getPromptState().defaults;
    cancelledRef.current = false;
    setMessage(null);
    setPhase("linking");
    try {
      const result = await linkDevice({
        baseUrl,
        appId: defaults?.appId,
        platform: defaults?.platform,
        installId: getOrCreateClientId(),
        device: readInstallDevice(defaults?.device),
        isCancelled: () => cancelledRef.current,
      });
      if (result.status === "linked") setDeviceName(result.deviceName);
      if (result.status === "expired")
        setMessage("Link expired, try again.");
    } catch {
      setMessage("Heimdall cloud is unreachable.");
    } finally {
      setPhase("idle");
    }
  }, [baseUrl]);

  const onCancelLinking = useCallback(() => {
    cancelledRef.current = true;
    setPhase("idle");
  }, []);

  const onConnect = useCallback(async () => {
    const defaults = getPromptState().defaults;
    if (!defaults) return;
    setMessage(null);
    setPhase("connecting");
    try {
      const target = await createCloudResolver({ baseUrl }).resolve();
      if (!target) {
        setDeviceName(loadCloudDevice()?.name ?? null);
        setMessage(`Start Heimdall for ${deviceName ?? "this device"} first.`);
        return;
      }
      startConnecting(() => connectToCloudTarget({ defaults, target }));
    } catch {
      const stillLinked = loadCloudDevice();
      setDeviceName(stillLinked?.name ?? null);
      setMessage(
        stillLinked
          ? "Heimdall cloud is unreachable."
          : "This device was unlinked. Find it again."
      );
    } finally {
      setPhase("idle");
    }
  }, [baseUrl, deviceName, startConnecting]);

  const onUnlink = useCallback(async () => {
    const device = loadCloudDevice();
    clearCloudDevice();
    setDeviceName(null);
    setMessage(null);
    if (device) {
      try {
        await unlinkDevice({ baseUrl, token: device.token });
      } catch {
        // ignore: local unlink is enough
      }
    }
  }, [baseUrl]);

  return {
    deviceName,
    phase,
    message,
    onFindMe,
    onCancelLinking,
    onConnect,
    onUnlink,
  };
};

export default useCloudView;
