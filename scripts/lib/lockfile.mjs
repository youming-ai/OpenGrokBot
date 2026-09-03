import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

import { repoRoot } from "./config.mjs";

const require = createRequire(import.meta.url);

function parseJsonc(text) {
  try {
    return JSON.parse(text);
  } catch {
    // bun.lock is JSONC (trailing commas); jsonc-parser is a declared dependency.
    return require("jsonc-parser").parse(text);
  }
}

function splitScopedSpecifier(specifier) {
  const at = specifier.lastIndexOf("@");
  if (at <= 0) return null;
  return { name: specifier.slice(0, at), version: specifier.slice(at + 1) };
}

function fromBunLock(lock) {
  const result = new Map();
  for (const [key, entry] of Object.entries(lock.packages ?? {})) {
    if (!Array.isArray(entry) || typeof entry[0] !== "string") continue;
    const parsed = splitScopedSpecifier(entry[0]);
    if (parsed == null || parsed.name !== key) continue;
    result.set(parsed.name, {
      version: parsed.version,
      integrity: typeof entry[3] === "string" ? entry[3] : undefined,
    });
  }
  return result;
}

function fromNpmLock(lock) {
  const result = new Map();
  for (const [key, record] of Object.entries(lock.packages ?? {})) {
    if (!key.startsWith("node_modules/") || record == null || typeof record !== "object") continue;
    const name = key.slice("node_modules/".length);
    if (name.includes("node_modules/")) continue;
    result.set(name, { version: record.version, integrity: record.integrity });
  }
  return result;
}

/**
 * Package-manager-agnostic lockfile reader. Prefers bun.lock (current
 * toolchain) and falls back to package-lock.json for legacy checkouts.
 * Returns the installing manager plus name -> { version, integrity }.
 */
export async function readLockedPackages() {
  try {
    const bunLock = parseJsonc(await readFile(path.join(repoRoot, "bun.lock"), "utf8"));
    return { manager: "bun", packages: fromBunLock(bunLock) };
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const npmLock = JSON.parse(await readFile(path.join(repoRoot, "package-lock.json"), "utf8"));
  return { manager: "npm", packages: fromNpmLock(npmLock) };
}
