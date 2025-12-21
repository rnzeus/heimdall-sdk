import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "zustand/index": "src/zustand/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  treeshake: true,
  target: "es2019",
  platform: "neutral",
  external: [
    "react",
    "react-native",
    "zustand",
    "zustand/vanilla",
    "react-native-tcp-socket",
    "react-native-mmkv",
  ],
});
