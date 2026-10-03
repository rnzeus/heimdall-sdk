import { StyleSheet } from "react-native";

export default StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  keyboard: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  card: {
    borderRadius: 14,
    maxWidth: 360,
    padding: 18,
    width: "86%",
  },
});
