import {
  generateChannelId,
  getCurrentChannel,
  getCurrentHost,
  getCurrentPort,
  getLastError,
  getPromptState,
  isConnected,
  subscribePrompt,
} from "@core/connection";
import { useEffect, useState } from "react";
import { PromptUiState } from "./types";

const usePromptUi = () => {
  const initialPrompt = getPromptState();
  const initiallyConnected = isConnected();
  const currentHost = getCurrentHost();
  const currentPort = getCurrentPort();
  const currentChannel = getCurrentChannel();
  const initialError = getLastError();

  const [ui, setUi] = useState<PromptUiState>(() => {
    const defaultHost = initialPrompt.defaults?.host ?? "127.0.0.1";
    const defaultPort = String(initialPrompt.defaults?.port ?? 35678);
    const defaultChannel = generateChannelId("session");

    return {
      visible: initialPrompt.visible,
      host: initiallyConnected && currentHost ? currentHost : defaultHost,
      port:
        initiallyConnected && currentPort != null
          ? String(currentPort)
          : defaultPort,
      channel:
        initiallyConnected && currentChannel ? currentChannel : defaultChannel,
      isConnected: initiallyConnected,
      errorMessage: initialError ?? null,
    };
  });

  useEffect(() => {
    const unsubscribe = subscribePrompt(() => {
      const s = getPromptState();
      const connectedNow = isConnected();
      const chHost = getCurrentHost();
      const chPort = getCurrentPort();
      const chChannel = getCurrentChannel();
      const lastError = getLastError();

      setUi((prev) => {
        // modal just opened
        if (s.visible && !prev.visible) {
          if (connectedNow && chHost && chPort != null && chChannel) {
            return {
              visible: true,
              host: chHost,
              port: String(chPort),
              channel: chChannel,
              isConnected: true,
              errorMessage: null,
            };
          }

          const defaults = s.defaults;
          const host = defaults?.host ?? prev.host ?? "127.0.0.1";
          const port = String(defaults?.port ?? (Number(prev.port) || 35678));
          const channel =
            prev.channel && !prev.isConnected
              ? prev.channel
              : generateChannelId("session");

          return {
            visible: true,
            host,
            port,
            channel,
            isConnected: false,
            errorMessage: lastError ?? null,
          };
        }

        // just synchronize visible and error
        return {
          ...prev,
          visible: s.visible,
          isConnected: connectedNow,
          errorMessage: lastError ?? null,
        };
      });
    });

    return unsubscribe;
  }, []);

  return [ui, setUi] as const;
};

export default usePromptUi;
