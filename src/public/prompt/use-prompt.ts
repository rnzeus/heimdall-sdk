import { useMemo } from "react";
import type { UsePromptProps } from "./types";
import {
  channelFromInput,
  connect,
  disconnect,
  getPromptState,
  hidePrompt,
} from "../../core/connection";

const usePrompt = (
  props: UsePromptProps & {
    startConnecting: (connectFn: () => void) => void;
  }
) => {
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

    const channel = channelFromInput(props.channel);

    props.startConnecting(() => connect({ ...defaults, channel, host, port }));
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
