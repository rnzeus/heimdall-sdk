import fs from "node:fs";
import path from "node:path";

let esbuild;
try {
  esbuild = await import("esbuild");
} catch (e) {
  console.error(
    "[minify-dist] esbuild is not installed. Run `yarn install` first."
  );
  process.exitCode = 1;
  process.exit();
}

const root = path.resolve(process.argv[2] ?? "dist");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  /** @type {string[]} */
  const out = [];
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

if (!fs.existsSync(root)) {
  console.error(`[minify-dist] Directory not found: ${root}`);
  process.exitCode = 1;
  process.exit();
}

const files = walk(root).filter((f) => f.endsWith(".js"));
let touched = 0;

for (const f of files) {
  const code = fs.readFileSync(f, "utf8");
  const result = await esbuild.transform(code, {
    loader: "js",
    format: "esm",
    platform: "neutral",
    target: "es2019",
    sourcemap: false,
    minify: true,
    legalComments: "none",
  });
  fs.writeFileSync(f, result.code, "utf8");
  touched += 1;
}

// eslint-disable-next-line no-console
console.log(`[minify-dist] minified ${touched} files under ${root}`);
