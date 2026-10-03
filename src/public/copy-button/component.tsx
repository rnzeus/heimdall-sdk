import { Pressable, View } from "react-native";
import styles from "./styles";
import type { PressableProps } from "react-native";

type Props = PressableProps & { tone?: "light" | "dark" };

const CopyButton = ({ tone = "light", ...props }: Props) => {
  const isDark = tone === "dark";
  return (
    <Pressable
      {...props}
      disabled={props.disabled || props.onPress === undefined}
      style={[
        styles.copyButton,
        isDark && styles.copyButtonDark,
        props.disabled && styles.copyButtonDisabled,
      ]}
    >
      <View style={styles.copyIconWrapper}>
        <View style={[styles.copyIconBack, isDark && styles.copyIconDark]} />
        <View style={[styles.copyIconFront, isDark && styles.copyIconDark]} />
      </View>
    </Pressable>
  );
};

CopyButton.displayName = "CopyButton";

export default CopyButton;
