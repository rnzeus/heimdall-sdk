import { Text } from "react-native";
import type { JSX } from "react";

import ActionButton from "../ui/action-button";
import Footer from "../ui/footer";
import ScreenRecording from "../ui/screen-recording";
import StatusLine from "../ui/status-line";
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
  /** a step the user takes while it connects, e.g. the iOS Local Network question */
  notice: string | null;
  startConnecting: (connectFn: () => void) => void;
  onManual: () => void;
};

const CloudView = ({
  baseUrl,
  visible,
  socketError,
  theme,
  isConnecting,
  notice,
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
          ? "Start Heimdall for this device on your computer."
          : "Link this device with your Heimdall account."}
      </Text>
      <StatusLine error={error} notice={notice} theme={theme} />
      <ScreenRecording theme={theme} />
      <Footer
        start={
          <ActionButton
            title="Enter manually"
            variant="link"
            theme={theme}
            disabled={isBusy}
            onPress={onManual}
          />
        }
        end={
          deviceName ? (
            <ActionButton
              title="Unlink"
              variant="quiet"
              theme={theme}
              disabled={isBusy}
              onPress={onUnlink}
            />
          ) : null
        }
        primary={
          <ActionButton
            title={
              isConnecting ? "Connecting…" : deviceName ? "Connect" : "Find me"
            }
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
