import { StyleSheet, Text, View } from "react-native";
import type { JSX } from "react";

import type { PromptTheme } from "../theme";

export type HeaderStatus = "idle" | "busy" | "connected" | "error";

type Props = { title: string; status: HeaderStatus; theme: PromptTheme };

const Header = ({ title, status, theme }: Props): JSX.Element => {
  const dot = {
    idle: theme.idle,
    busy: theme.warning,
    connected: theme.success,
    error: theme.danger,
  }[status];

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", marginBottom: 8 },
  dot: { borderRadius: 4, height: 8, marginRight: 8, width: 8 },
  title: { flexShrink: 1, fontSize: 16, fontWeight: "600" },
});

export default Header;
