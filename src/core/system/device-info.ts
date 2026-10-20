import { Platform } from "react-native";
import type { HelloAppInfo, HelloDeviceInfo } from "../../types";
import { isAndroidEmulator } from "./emulator";

const text = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const out = String(value).trim();
  return out ? out : undefined;
};

const compact = <T extends Record<string, string | undefined>>(input: T): Partial<T> | undefined => {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) (out as Record<string, string>)[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
};

export function readDeviceInfo(): HelloDeviceInfo | undefined {
  try {
    const constants: Record<string, unknown> = (Platform as any).constants ?? {};
    if (Platform.OS === "android") {
      return compact({
        os: "android",
        osVersion: text(constants.Release) ?? text(Platform.Version),
        model: text(constants.Model),
        manufacturer: text(constants.Manufacturer),
      });
    }
    return compact({
      os: text(Platform.OS),
      osVersion: text(constants.osVersion) ?? text(Platform.Version),
    });
  } catch {
    return undefined;
  }
}

export type InstallDevice = {
  os?: string;
  osVersion?: string;
  model?: string;
  manufacturer?: string;
  idiom?: string;
  emulator?: boolean;
  id?: string;
};

export function readInstallDevice(override?: {
  id?: string;
  isEmulator?: boolean;
}): InstallDevice {
  const base: InstallDevice = { ...readDeviceInfo() };
  try {
    const constants: Record<string, unknown> =
      (Platform as any).constants ?? {};
    if (Platform.OS === "android") base.emulator = isAndroidEmulator(constants);
    else base.idiom = text(constants.interfaceIdiom);
  } catch {
    // ignore
  }
  if (typeof override?.isEmulator === "boolean")
    base.emulator = override.isEmulator;
  const id = text(override?.id);
  if (id) base.id = id;
  return base;
}

export function normaliseAppInfo(app: unknown): HelloAppInfo | undefined {
  if (!app || typeof app !== "object") return undefined;
  const input = app as Record<string, unknown>;
  return compact({
    version: text(input.version),
    build: text(input.build),
    environment: text(input.environment),
  });
}
