import { useColorScheme } from "react-native";

/** Heimdall's own colours, as in the desktop app: the brand orange for the main action, the soft orange for links. */
export type PromptTheme = {
  backdrop: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  inputBackground: string;
  inputDisabledBackground: string;
  /** the main button: the brand orange */
  primary: string;
  onPrimary: string;
  /** links and the “connecting” dot */
  link: string;
  danger: string;
  /** connected, as the session blue in the desktop app */
  session: string;
  warning: string;
  idle: string;
};

const LIGHT: PromptTheme = {
  backdrop: "rgba(0,0,0,0.38)",
  card: "#FFFFFF",
  text: "#161B22",
  muted: "#5F6672",
  border: "#DDE1E7",
  inputBackground: "#F7F8FA",
  inputDisabledBackground: "#EEF0F3",
  primary: "#FC7F1C",
  onPrimary: "#1C0D00",
  link: "#B85407",
  danger: "#C62828",
  session: "#0A78BF",
  warning: "#B85407",
  idle: "#9CA3AF",
};

const DARK: PromptTheme = {
  backdrop: "rgba(0,0,0,0.55)",
  card: "#171C23",
  text: "#DEE2ED",
  muted: "#9E9E9E",
  border: "#30353E",
  inputBackground: "#0F141B",
  inputDisabledBackground: "#1D232B",
  primary: "#FC7F1C",
  onPrimary: "#1C0D00",
  link: "#FFAD66",
  danger: "#FF6B6B",
  session: "#42BAFD",
  warning: "#FFAD66",
  idle: "#6B7280",
};

export const usePromptTheme = (): PromptTheme =>
  useColorScheme() === "dark" ? DARK : LIGHT;
