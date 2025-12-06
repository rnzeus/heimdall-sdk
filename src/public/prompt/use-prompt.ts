import { useMemo } from "react";
import { UsePromptProps } from "./types";
import {
  connect,
  disconnect,
  getPromptState,
  hidePrompt,
  isChannel,
  sanitizeChannelSlug,
} from "@core/connection";
import { generateChannelId } from "@core/connection";

const usePrompt = (props: UsePromptProps) => {
  const onCancel = () => {
    hidePrompt();
  };

  const onConfirmConnect = () => {
    const state = getPromptState();
    const defaults = state.defaults;

    if (!defaults) {
      hidePrompt();
      return;
    }

    const host = props.host.trim() || defaults.host;
    const portNum = Number(props.port);
    const port =
      Number.isFinite(portNum) && portNum > 0 ? portNum : defaults.port;

    let channel = props.channel.trim();
    if (!isChannel(channel)) {
      const slug = sanitizeChannelSlug(channel || "session");
      channel = generateChannelId(slug);
    }

    // try to connect: if there is an error, it will come from connect-socket
    connect({ ...defaults, channel, host, port });

    hidePrompt();
  };

  const onConfirmDisconnect = () => {
    disconnect();
    hidePrompt();
  };

  const isInputDisabled = useMemo(() => props.isConnected, [props.isConnected]);

  const handleCopyChannel = () => {
    if (!props.channel || !props.onCopyToClipboard) return;
    props.onCopyToClipboard(props.channel);
  };

  return {
    onCancel,
    onConfirmConnect,
    onConfirmDisconnect,
    isInputDisabled,
    handleCopyChannel,
  };
};

export default usePrompt;
