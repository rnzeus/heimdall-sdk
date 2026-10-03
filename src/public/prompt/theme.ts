import { useColorScheme } from "react-native";

export type PromptTheme = {
  backdrop: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  inputBackground: string;
  inputDisabledBackground: string;
  primary: string;
  onPrimary: string;
  danger: string;
  success: string;
  warning: string;
  idle: string;
};

const LIGHT: PromptTheme = {
  backdrop: "rgba(0,0,0,0.38)",
  card: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  inputBackground: "#FFFFFF",
  inputDisabledBackground: "#F3F4F6",
  primary: "#2563EB",
  onPrimary: "#FFFFFF",
  danger: "#DC2626",
  success: "#16A34A",
  warning: "#D97706",
  idle: "#9CA3AF",
};

const DARK: PromptTheme = {
  backdrop: "rgba(0,0,0,0.55)",
  card: "#1C1F26",
  text: "#F3F4F6",
  muted: "#9CA3AF",
  border: "#2D323C",
  inputBackground: "#14171C",
  inputDisabledBackground: "#23272F",
  primary: "#3B82F6",
  onPrimary: "#FFFFFF",
  danger: "#F87171",
  success: "#4ADE80",
  warning: "#FBBF24",
  idle: "#6B7280",
};

export const usePromptTheme = (): PromptTheme =>
  useColorScheme() === "dark" ? DARK : LIGHT;
