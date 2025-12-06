export type Props = {
  onCopyToClipboard?: (text: string) => void;
};

export type PromptUiState = {
  visible: boolean;
  host: string;
  port: string;
  channel: string;
  isConnected: boolean;
  errorMessage: string | null;
};

export type UsePromptProps = Pick<
  PromptUiState,
  "host" | "port" | "channel" | "visible" | "isConnected"
> &
  Props;
