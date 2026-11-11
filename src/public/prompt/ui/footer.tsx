import { StyleSheet, View } from "react-native";
import type { JSX, ReactNode } from "react";

type Props = {
  /** the main action, across the whole card */
  primary?: ReactNode;
  /** links under it: the other way to connect on the left, a rarer action on the right */
  start?: ReactNode;
  end?: ReactNode;
};

const Footer = ({ primary, start, end }: Props): JSX.Element => (
  <View style={styles.column}>
    {primary}
    {start || end ? (
      <View style={styles.links}>
        <View>{start}</View>
        <View>{end}</View>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  column: { gap: 6, marginTop: 16 },
  links: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default Footer;
