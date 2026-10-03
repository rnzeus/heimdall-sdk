import { Text } from "react-native";
import type { JSX } from "react";

import ActionButton from "../ui/action-button";
import Footer from "../ui/footer";
import Header from "../ui/header";
import type { PromptTheme } from "../theme";
import useCloudView from "./use-cloud-view";
import styles from "./styles";

type Props = {
  baseUrl: string;
  visible: boolean;
  socketError: string | null;
  theme: PromptTheme;
  isConnecting: boolean;
  startConnecting: (connectFn: () => void) => void;
  onManual: () => void;
};

const CloudView = ({
  baseUrl,
  visible,
  socketError,
  theme,
  isConnecting,
  startConnecting,
  onManual,
}: Props): JSX.Element => {
  const {
    deviceName,
    phase,
    message,
    onFindMe,
    onCancelLinking,
    onConnect,
    onUnlink,
  } = useCloudView({ baseUrl, visible, startConnecting });

  const error = isConnecting ? null : (message ?? socketError);
  const isBusy = phase !== "idle" || isConnecting;

  if (phase === "linking") {
    return (
      <>
        <Header title="Heimdall" status="busy" theme={theme} />
        <Text style={[styles.text, { color: theme.muted }]}>
          Sign in and pick this device in the browser, then come back.
        </Text>
        <Footer
          primary={
            <ActionButton
              title="Cancel"
              variant="link"
              theme={theme}
              onPress={onCancelLinking}
            />
          }
        />
      </>
    );
  }

  return (
    <>
      <Header
        title={deviceName ?? "Heimdall"}
        status={error ? "error" : isBusy ? "busy" : "idle"}
        theme={theme}
      />
      <Text style={[styles.text, { color: theme.muted }]}>
        {deviceName
          ? "Start Heimdall for this device on your Mac."
          : "Link this device with your Heimdall account."}
      </Text>
      {error ? (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      ) : null}
      <Footer
        secondary={
          <>
            {deviceName ? (
              <ActionButton
                title="Unlink"
                variant="link"
                theme={theme}
                disabled={isBusy}
                onPress={onUnlink}
              />
            ) : null}
            <ActionButton
              title="Enter manually"
              variant="link"
              theme={theme}
              disabled={isBusy}
              onPress={onManual}
            />
          </>
        }
        primary={
          <ActionButton
            title={isConnecting ? "Connecting…" : deviceName ? "Connect" : "Find me"}
            theme={theme}
            disabled={isBusy}
            onPress={deviceName ? onConnect : onFindMe}
          />
        }
      />
    </>
  );
};

export default CloudView;
