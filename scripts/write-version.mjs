import {readFileSync, writeFileSync} from "node:fs";

const {version} = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const target = new URL("../src/version.ts", import.meta.url);
const content = `export const SDK_VERSION = "${version}";\n`;

let current = "";
try {
  current = readFileSync(target, "utf8");
} catch {}
if (current !== content) writeFileSync(target, content);
