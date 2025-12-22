import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "zustand/index": "src/zustand/index.ts",
  },
  format: ["esm"],
  dts: false,
  clean: false,
  outDir: "dist",
  target: "es2019",
  platform: "neutral",
  treeshake: false,
  minify: false,
  splitting: true,
  sourcemap: true,
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
