import { StyleSheet } from "react-native";

export default StyleSheet.create({
  copyButton: {
    backgroundColor: "#f3f3f3",
    borderColor: "#ddd",
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    width: 28,
  },
  copyButtonDisabled: {
    opacity: 0.4,
  },
  copyIconWrapper: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  copyIconBack: {
    backgroundColor: "#f0f0f0",
    borderColor: "#555",
    borderRadius: 3,
    borderWidth: 1,
    height: 14,
    left: "50%",
    position: "absolute",
    top: "50%",
    transform: [{ translateX: -5 }, { translateY: -8 }],
    width: 12,
  },
  copyIconFront: {
    backgroundColor: "#f3f3f3",
    borderColor: "#555",
    borderRadius: 3,
    borderWidth: 1,
    height: 14,
    left: "50%",
    position: "absolute",
    top: "50%",
    transform: [{ translateX: -8 }, { translateY: -5 }],
    width: 12,
    zIndex: 1,
  },
});
