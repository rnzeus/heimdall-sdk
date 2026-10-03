import { StyleSheet, View } from "react-native";
import type { JSX, ReactNode } from "react";

type Props = { secondary?: ReactNode; primary?: ReactNode };

const Footer = ({ secondary, primary }: Props): JSX.Element => (
  <View style={styles.row}>
    <View style={styles.secondary}>{secondary}</View>
    {primary}
  </View>
);

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  secondary: { alignItems: "center", flexDirection: "row", gap: 16 },
});

export default Footer;
