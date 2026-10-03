import { Pressable, StyleSheet, Text } from "react-native";
import type { JSX } from "react";

import type { PromptTheme } from "../theme";

type Props = {
  title: string;
  onPress: () => void;
  theme: PromptTheme;
  variant?: "primary" | "danger" | "link";
  disabled?: boolean;
};

const ActionButton = ({
  title,
  onPress,
  theme,
  variant = "primary",
  disabled = false,
}: Props): JSX.Element => {
  const isLink = variant === "link";
  const background = isLink
    ? "transparent"
    : variant === "danger"
      ? theme.danger
      : theme.primary;
  const color = isLink ? theme.primary : theme.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        isLink ? styles.link : styles.button,
        { backgroundColor: background },
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Text style={[styles.title, { color }]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  link: { paddingVertical: 9 },
  title: { fontSize: 14, fontWeight: "600" },
  dimmed: { opacity: 0.5 },
});

export default ActionButton;
