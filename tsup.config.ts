import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "zustand/index": "src/zustand/index.ts",
  },
  format: ["esm"],
  dts: false,
  sourcemap: false,
  clean: false,
  outDir: "dist",
  treeshake: false,
  minify: false,
  target: "es2019",
  platform: "neutral",
  splitting: false,
  outExtension() {
    return { js: ".js" };
  },
  external: [
    "react",
    "react-native",
    "zustand",
    "zustand/vanilla",
    "react-native-tcp-socket",
    "react-native-mmkv",
  ],
});
