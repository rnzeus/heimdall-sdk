import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  connect,
  disconnect,
  isConnected,
  getCurrentChannel,
  getCurrentHost,
  getCurrentPort,
} from "./connection";
import { generateChannelId, sanitizeChannelSlug, isChannel } from "./channel";
import { getPromptState, subscribePrompt, hidePrompt } from "./prompt-state";

export type HeimdallConnectPromptProps = {
  /**
   * Optional callback for copying text to clipboard.
   * If not passed, the "copy" button will be visually disabled
   * and nothing will happen.
   */
  onCopyToClipboard?: (text: string) => void;
};

type PromptUiState = {
  visible: boolean;
  host: string;
  port: string;
  channel: string;
  isConnected: boolean;
};

const HeimdallConnectPrompt = ({
  onCopyToClipboard,
}: HeimdallConnectPromptProps): JSX.Element | null => {
  const initialPrompt = getPromptState();
  const initiallyConnected = isConnected();
  const currentHost = getCurrentHost();
  const currentPort = getCurrentPort();
  const currentChannel = getCurrentChannel();

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
    };
  });

  useEffect(() => {
    const unsubscribe = subscribePrompt(() => {
      const s = getPromptState();
      const connectedNow = isConnected();
      const chHost = getCurrentHost();
      const chPort = getCurrentPort();
      const chChannel = getCurrentChannel();

      setUi((prev) => {
        // modal just opened
        if (s.visible && !prev.visible) {
          if (connectedNow && chHost && chPort != null && chChannel) {
            // already connected: show current configuration
            return {
              visible: true,
              host: chHost,
              port: String(chPort),
              channel: chChannel,
              isConnected: true,
            };
          }

          // not connected: use defaults from configureConnectPrompt
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
          };
        }

        // just synchronization of visible, without changing values
        return {
          ...prev,
          visible: s.visible,
        };
      });
    });

    return unsubscribe;
  }, []);

  if (!ui.visible) return null;

  const onCancel = () => {
    hidePrompt();
  };

  const onConfirmConnect = () => {
    const state = getPromptState();
    const defaults = state.defaults;

    if (!defaults) {
      // if consumer didn't call configureConnectPrompt — just close
      hidePrompt();
      return;
    }

    // normalize host/port/channel
    const host = ui.host.trim() || defaults.host;
    const portNum = Number(ui.port);
    const port =
      Number.isFinite(portNum) && portNum > 0 ? portNum : defaults.port;

    let channel = ui.channel.trim();
    if (!isChannel(channel)) {
      const slug = sanitizeChannelSlug(channel || "session");
      channel = generateChannelId(slug);
    }

    connect({ ...defaults, channel, host, port });

    hidePrompt();
  };

  const onConfirmDisconnect = () => {
    disconnect();
    hidePrompt();
  };

  const isInputDisabled = ui.isConnected;

  const handleCopyChannel = () => {
    if (!ui.channel || !onCopyToClipboard) return;
    onCopyToClipboard(ui.channel);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={ui.visible}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>Heimdall Connection</Text>
          <Text style={styles.subtitle}>
            {ui.isConnected
              ? "SDK is connected. You can disconnect from this Heimdall host."
              : "Configure Heimdall host / port / channel for this session."}
          </Text>

          {/* host */}
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

          {/* port */}
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

          {/* channel + optional copy */}
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
        </View>
      </View>
    </Modal>
  );
};

type CopyButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

const CopyButton = ({ onPress, disabled }: CopyButtonProps) => {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      style={[styles.copyButton, disabled && styles.copyButtonDisabled]}
    >
      <View style={styles.copyIconWrapper}>
        <View style={styles.copyIconBack} />
        <View style={styles.copyIconFront} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "#0006",
    flex: 1,
    justifyContent: "center",
  },
  copyButton: {
    backgroundColor: "#f3f3f3",
    borderColor: "#ddd",
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    width: 28,
  },
  copyButtonDisabled: {
    opacity: 0.4,
  },
  copyIconBack: {
    backgroundColor: "#f0f0f0",
    borderColor: "#555",
    borderRadius: 3,
    borderWidth: 1,
    height: 14,
    left: "50%",
    position: "absolute",
    top: "50%",
    transform: [{ translateX: -5 }, { translateY: -8 }],
    width: 12,
  },
  copyIconFront: {
    backgroundColor: "#f3f3f3",
    borderColor: "#555",
    borderRadius: 3,
    borderWidth: 1,
    height: 14,
    left: "50%",
    position: "absolute",
    top: "50%",
    transform: [{ translateX: -8 }, { translateY: -5 }],
    width: 12,
    zIndex: 1,
  },
  copyIconWrapper: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  input: {
    borderColor: "#ccc",
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
  },
  inputWithIcon: {
    flex: 1,
    marginRight: 8,
  },

  inputWithIconRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    marginBottom: 4,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    width: "80%",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  spacer: { width: 8 },
  subtitle: { fontSize: 12, marginBottom: 12 },
  title: { fontWeight: "600", marginBottom: 4 },
});

HeimdallConnectPrompt.displayName = "HeimdallConnectPrompt";

export default HeimdallConnectPrompt;
