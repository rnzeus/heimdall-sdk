import { Text, TextInput, View } from "react-native";
import type { Dispatch, JSX, SetStateAction } from "react";

import { CopyButton } from "../../copy-button";
import ActionButton from "../ui/action-button";
import Footer from "../ui/footer";
import Header from "../ui/header";
import type { PromptTheme } from "../theme";
import type { PromptUiState } from "../types";
import styles from "./styles";

type Props = {
  ui: PromptUiState;
  setUi: Dispatch<SetStateAction<PromptUiState>>;
  theme: PromptTheme;
  isDark: boolean;
  canCopy: boolean;
  onCopyChannel: () => void;
  onConnect: () => void;
  onBack?: () => void;
};

const ManualView = ({
  ui,
  setUi,
  theme,
  isDark,
  canCopy,
  onCopyChannel,
  onConnect,
  onBack,
}: Props): JSX.Element => {
  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.inputBackground,
      borderColor: theme.border,
      color: theme.text,
    },
  ];
  const labelStyle = [styles.label, { color: theme.muted }];

  return (
    <>
      <Header
        title="Heimdall"
        status={ui.errorMessage ? "error" : "idle"}
        theme={theme}
      />

      <Text style={labelStyle}>Host</Text>
      <TextInput
        value={ui.host}
        onChangeText={(text) => setUi((prev) => ({ ...prev, host: text }))}
        style={inputStyle}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="127.0.0.1"
        placeholderTextColor={theme.idle}
      />

      <Text style={labelStyle}>Port</Text>
      <TextInput
        value={ui.port}
        onChangeText={(text) => setUi((prev) => ({ ...prev, port: text }))}
        style={inputStyle}
        keyboardType="number-pad"
        placeholder="35678"
        placeholderTextColor={theme.idle}
      />

      <Text style={labelStyle}>Channel</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={ui.channel}
          onChangeText={(text) => setUi((prev) => ({ ...prev, channel: text }))}
          style={[inputStyle, styles.inputFlex]}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="heimdall://session-xxxxxx"
          placeholderTextColor={theme.idle}
        />
        <CopyButton
          tone={isDark ? "dark" : "light"}
          disabled={!canCopy}
          onPress={onCopyChannel}
        />
      </View>

      {ui.errorMessage ? (
        <Text style={[styles.error, { color: theme.danger }]}>
          {ui.errorMessage}
        </Text>
      ) : null}

      <Footer
        secondary={
          onBack ? (
            <ActionButton
              title="Back"
              variant="link"
              theme={theme}
              onPress={onBack}
            />
          ) : null
        }
        primary={
          <ActionButton title="Connect" theme={theme} onPress={onConnect} />
        }
      />
    </>
  );
};

export default ManualView;
