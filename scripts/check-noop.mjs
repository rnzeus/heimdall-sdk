import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../dist/noop/", import.meta.url);
const IMPORT_RE = /\bimport\b|\brequire\s*\(|\bfrom\s*["']/;

const offenders = readdirSync(dir)
  .filter((name) => name.endsWith(".js"))
  .filter((name) => IMPORT_RE.test(readFileSync(new URL(name, dir), "utf8")));

if (offenders.length > 0) {
  console.error(
    `[check-noop] dist/noop must not import anything at runtime, found imports in: ${offenders.join(", ")}`
  );
  process.exitCode = 1;
}
