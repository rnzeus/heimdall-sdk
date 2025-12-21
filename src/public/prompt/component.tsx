import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
} from "react-native";
import { Props } from "./types";
import usePromptUi from "./use-prompt-ui";
import usePrompt from "./use-prompt";
import usePromptAnimation from "./use-prompt-animation";
import styles from "./styles";
import { CopyButton } from "../copy-button";
import { useMemo } from "react";

const HeimdallConnectPrompt = ({
  onCopyToClipboard,
}: Props): JSX.Element | null => {
  const [ui, setUi] = usePromptUi();
  const {
    onCancel,
    onConfirmConnect,
    onConfirmDisconnect,
    isInputDisabled,
    handleCopyChannel,
  } = usePrompt({ ...ui, onCopyToClipboard });

  const { mounted, opacity, scale } = usePromptAnimation({
    visible: ui.visible,
  });
  const backdropPointerEvents = useMemo(
    () => (ui.visible ? "auto" : "none"),
    [ui.visible]
  );

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.backdrop, { opacity }]}
      pointerEvents={backdropPointerEvents}
    >
      {/* Backdrop press target (behind modal) */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

      <Animated.View style={[styles.modal, { transform: [{ scale }] }]}>
        <Text style={styles.title}>Heimdall Connection</Text>
        <Text style={styles.subtitle}>
          {ui.isConnected
            ? "SDK is connected. You can disconnect from this Heimdall host."
            : "Configure Heimdall host / port / channel for this session."}
        </Text>

        {ui.errorMessage ? (
          <Text style={styles.error}>{ui.errorMessage}</Text>
        ) : null}

        <Text style={styles.label}>Host</Text>
        <TextInput
          value={ui.host}
          onChangeText={(text) => setUi((prev) => ({ ...prev, host: text }))}
          style={[styles.input, isInputDisabled && styles.inputDisabled]}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isInputDisabled}
          placeholder="127.0.0.1"
        />

        <Text style={styles.label}>Port</Text>
        <TextInput
          value={ui.port}
          onChangeText={(text) => setUi((prev) => ({ ...prev, port: text }))}
          style={[styles.input, isInputDisabled && styles.inputDisabled]}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          editable={!isInputDisabled}
          placeholder="35678"
        />

        <Text style={styles.label}>Channel</Text>
        <View style={styles.inputWithIconRow}>
          <TextInput
            value={ui.channel}
            onChangeText={(text) =>
              setUi((prev) => ({ ...prev, channel: text }))
            }
            style={[
              styles.input,
              styles.inputWithIcon,
              isInputDisabled && styles.inputDisabled,
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isInputDisabled}
            placeholder="heimdall://session-xxxxxx"
          />
          <CopyButton
            disabled={!ui.channel || !onCopyToClipboard}
            onPress={handleCopyChannel}
          />
        </View>

        <View style={styles.row}>
          <Button title="Cancel" onPress={onCancel} />
          <View style={styles.spacer} />
          {ui.isConnected ? (
            <Button title="Disconnect" onPress={onConfirmDisconnect} />
          ) : (
            <Button title="Connect" onPress={onConfirmConnect} />
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

HeimdallConnectPrompt.displayName = "HeimdallConnectPrompt";

export default HeimdallConnectPrompt;
