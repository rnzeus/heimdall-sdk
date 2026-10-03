import { Text, View } from "react-native";
import type { JSX } from "react";

import { CopyButton } from "../../copy-button";
import ActionButton from "../ui/action-button";
import Footer from "../ui/footer";
import Header from "../ui/header";
import type { PromptTheme } from "../theme";
import styles from "./styles";

type Props = {
  hostLabel: string;
  channel: string;
  theme: PromptTheme;
  isDark: boolean;
  canCopy: boolean;
  onCopyChannel: () => void;
  onClose: () => void;
  onDisconnect: () => void;
};

const ConnectedView = ({
  hostLabel,
  channel,
  theme,
  isDark,
  canCopy,
  onCopyChannel,
  onClose,
  onDisconnect,
}: Props): JSX.Element => (
  <>
    <Header title="Connected" status="connected" theme={theme} />
    <Text style={[styles.value, { color: theme.text }]}>{hostLabel}</Text>
    <View style={styles.channelRow}>
      <Text
        style={[styles.channel, { color: theme.muted }]}
        numberOfLines={1}
        selectable
      >
        {channel}
      </Text>
      <CopyButton
        tone={isDark ? "dark" : "light"}
        disabled={!canCopy}
        onPress={onCopyChannel}
      />
    </View>
    <Footer
      secondary={
        <ActionButton
          title="Close"
          variant="link"
          theme={theme}
          onPress={onClose}
        />
      }
      primary={
        <ActionButton
          title="Disconnect"
          variant="danger"
          theme={theme}
          onPress={onDisconnect}
        />
      }
    />
  </>
);

export default ConnectedView;
