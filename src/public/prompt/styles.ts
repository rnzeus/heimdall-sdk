import { Platform, StyleSheet } from "react-native";

export default StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 9999,
    elevation: 9999,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    width: "80%",
  },
  title: { fontWeight: "600", marginBottom: 4 },
  subtitle: { fontSize: 12, marginBottom: 12 },
  error: { color: "red", fontSize: 12, marginBottom: 12 },
  label: { fontSize: 11, marginBottom: 4 },
  input: {
    borderColor: "#ccc",
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
  },
  inputWithIcon: {
    flex: 1,
    marginRight: 8,
  },
  inputWithIconRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 8,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  spacer: { width: 8 },
});
