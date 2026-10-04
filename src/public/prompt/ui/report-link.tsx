import { Linking, Platform, Pressable, StyleSheet, Text } from "react-native";
import type { JSX } from "react";

import { SDK_VERSION } from "../../../version";
import type { PromptTheme } from "../theme";

const feedbackUrl = (baseUrl: string) => {
  const device = `${Platform.OS} ${String(Platform.Version)}`;
  const params = [
    "type=bug",
    "product=sdk",
    `sdkVersion=${encodeURIComponent(SDK_VERSION)}`,
    `device=${encodeURIComponent(device)}`,
  ];
  return `${baseUrl.replace(/\/+$/, "")}/feedback/new?${params.join("&")}`;
};

type Props = { baseUrl: string; theme: PromptTheme };

const ReportLink = ({ baseUrl, theme }: Props): JSX.Element => (
  <Pressable
    hitSlop={8}
    style={styles.container}
    onPress={() => void Linking.openURL(feedbackUrl(baseUrl))}
  >
    <Text style={[styles.text, { color: theme.muted }]}>Report a problem</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { alignSelf: "center", marginTop: 14 },
  text: { fontSize: 12, textDecorationLine: "underline" },
});

export default ReportLink;
