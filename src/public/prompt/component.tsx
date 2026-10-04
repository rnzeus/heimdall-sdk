import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { useCallback, useMemo, useState, type JSX } from "react";

import { getPromptState, setLastError } from "../../core/connection";
import { getCloudHostName } from "../../core/cloud";
import { loadPromptMode, savePromptMode, type PromptMode } from "./prompt-mode";
import { usePromptTheme } from "./theme";
import type { Props } from "./types";
import usePrompt from "./use-prompt";
import usePromptAnimation from "./use-prompt-animation";
import usePromptUi from "./use-prompt-ui";
import useConnectAwaiter from "./use-connect-awaiter";
import CloudView from "./views/cloud-view";
import ConnectedView from "./views/connected-view";
import ManualView from "./views/manual-view";
import ReportLink from "./ui/report-link";
import styles from "./styles";

const HeimdallConnectPrompt = ({
  onCopyToClipboard,
}: Props): JSX.Element | null => {
  const [ui, setUi] = usePromptUi();
  const { isConnecting, startConnecting } = useConnectAwaiter({
    visible: ui.visible,
  });
  const { onCancel, onConfirmConnect, onConfirmDisconnect, handleCopyChannel } =
    usePrompt({ ...ui, onCopyToClipboard, startConnecting });
  const { mounted, opacity, scale } = usePromptAnimation({
    visible: ui.visible,
  });
  const theme = usePromptTheme();
  const isDark = useColorScheme() === "dark";

  const cloudUrl = getPromptState().defaults?.cloud?.url;
  const [mode, setMode] = useState<PromptMode>(() =>
    cloudUrl ? (loadPromptMode() ?? "cloud") : "manual"
  );

  const switchMode = useCallback((next: PromptMode) => {
    setLastError(null);
    setMode(next);
    savePromptMode(next);
  }, []);

  const backdropPointerEvents = useMemo(
    () => (ui.visible ? "auto" : "none"),
    [ui.visible]
  );

  if (!mounted) return null;

  const canCopy = Boolean(ui.channel && onCopyToClipboard);

  const renderContent = () => {
    if (ui.isConnected) {
      return (
        <ConnectedView
          hostLabel={getCloudHostName(ui.channel) ?? `${ui.host}:${ui.port}`}
          channel={ui.channel}
          theme={theme}
          isDark={isDark}
          canCopy={canCopy}
          onCopyChannel={handleCopyChannel}
          onClose={onCancel}
          onDisconnect={onConfirmDisconnect}
        />
      );
    }

    if (cloudUrl && mode === "cloud") {
      return (
        <CloudView
          baseUrl={cloudUrl}
          visible={ui.visible}
          socketError={ui.errorMessage}
          theme={theme}
          isConnecting={isConnecting}
          startConnecting={startConnecting}
          onManual={() => switchMode("manual")}
        />
      );
    }

    return (
      <ManualView
        ui={ui}
        setUi={setUi}
        theme={theme}
        isDark={isDark}
        canCopy={canCopy}
        onCopyChannel={handleCopyChannel}
        onConnect={onConfirmConnect}
        onBack={cloudUrl ? () => switchMode("cloud") : undefined}
        isConnecting={isConnecting}
      />
    );
  };

  return (
    <Animated.View
      style={[styles.backdrop, { backgroundColor: theme.backdrop, opacity }]}
      pointerEvents={backdropPointerEvents}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.card, transform: [{ scale }] },
          ]}
        >
          {renderContent()}
          {cloudUrl ? <ReportLink baseUrl={cloudUrl} theme={theme} /> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

HeimdallConnectPrompt.displayName = "HeimdallConnectPrompt";

export default HeimdallConnectPrompt;
