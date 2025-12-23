import { Pressable, View } from "react-native";
import styles from "./styles";
import type { PressableProps } from "react-native";

const CopyButton = (props: PressableProps) => {
  return (
    <Pressable
      {...props}
      disabled={props.disabled || props.onPress === undefined}
      style={[styles.copyButton, props.disabled && styles.copyButtonDisabled]}
    >
      <View style={styles.copyIconWrapper}>
        <View style={styles.copyIconBack} />
        <View style={styles.copyIconFront} />
      </View>
    </Pressable>
  );
};

CopyButton.displayName = "CopyButton";

export default CopyButton;
