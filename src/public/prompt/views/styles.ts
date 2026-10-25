import { Platform, StyleSheet } from "react-native";

export default StyleSheet.create({
  text: { fontSize: 13, lineHeight: 18 },
  error: { fontSize: 12, marginTop: 8 },
  label: { fontSize: 11, marginBottom: 4, marginTop: 8 },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 9 : 5,
  },
  inputRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  inputFlex: { flex: 1 },
  value: { fontSize: 13 },
  channelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  channel: { flexShrink: 1, fontSize: 12 },
  code: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 2,
    marginTop: 2,
  },
});
