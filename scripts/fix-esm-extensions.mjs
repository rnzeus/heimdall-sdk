import fs from "node:fs";
import path from "node:path";

/**
 * Fixes ESM relative import specifiers in emitted JS so Node can resolve them.
 *
 * TypeScript (with moduleResolution=bundler) emits extensionless specifiers like:
 *   export * from "./middleware";
 *   import { x } from "../utils";
 *
 * Node ESM requires explicit extensions (or full index.js path).
 *
 * This script rewrites ONLY relative specifiers that:
 * - don't already end with a known extension
 * - and can be resolved to either:
 *   - <specifier>.js
 *   - <specifier>/index.js
 */

const root = path.resolve(process.argv[2] ?? "dist");

const KNOWN_EXT_RE =
  /\.(?:[cm]?js|json|node|wasm|css|svg|png|jpe?g|gif|webp)$/i;

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

function resolveReplacement(fileAbsPath, spec) {
  if (!spec.startsWith(".")) return null;
  if (KNOWN_EXT_RE.test(spec)) return null;
  if (spec.includes("?") || spec.includes("#")) return null;

  const fileDir = path.dirname(fileAbsPath);
  const abs = path.resolve(fileDir, spec);

  // Prefer direct file: ./x -> ./x.js
  if (fs.existsSync(abs + ".js")) return spec + ".js";

  // Handle directory imports: ../utils -> ../utils/index.js
  if (fs.existsSync(path.join(abs, "index.js"))) {
    const normalized = spec.replace(/\/+$/, "");
    return normalized + "/index.js";
  }

  return null;
}

function fixFile(fileAbsPath) {
  const before = fs.readFileSync(fileAbsPath, "utf8");
  let changed = false;

  // import ... from "..."
  // export ... from "..."
  // import("...") (dynamic)
  const after = before.replace(
    /\b(from\s+|import\s*\()\s*(['"])(\.[^'"]+)\2/g,
    (full, prefix, quote, spec) => {
      const replacement = resolveReplacement(fileAbsPath, spec);
      if (!replacement) return full;
      changed = true;
      return `${prefix}${quote}${replacement}${quote}`;
    }
  );

  if (changed) fs.writeFileSync(fileAbsPath, after, "utf8");
  return changed;
}

if (!fs.existsSync(root)) {
  console.error(`[fix-esm-extensions] Directory not found: ${root}`);
  process.exitCode = 1;
} else {
  const files = walk(root).filter((f) => f.endsWith(".js"));
  let touched = 0;
  for (const f of files) {
    if (fixFile(f)) touched += 1;
  }
  // eslint-disable-next-line no-console
  console.log(
    `[fix-esm-extensions] fixed ${touched}/${files.length} files under ${root}`
  );
}
