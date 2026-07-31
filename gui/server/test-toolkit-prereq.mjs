// test-toolkit-prereq.mjs — shared TEST prerequisite for suites that need a toolkit
// CHECKOUT (repo cut, AIO-594 F7/F8). Some suites (seam-parity expectations, the
// compiled operator loop, the UX harness) exercise toolkit-side modules that are not
// part of the published @aiosbrain/foundation surface. Those suites resolve the
// toolkit through the toolkit-location contract (gui/server/toolkit-locate.mjs) and
// SKIP with an explicit reason when no toolkit checkout is available — they never
// hard-code a pre-cut `../../scripts/...` relative path.

import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { locateToolkit } from "./toolkit-locate.mjs";

/**
 * Existence-only variant: resolve a toolkit checkout and verify it carries the given
 * toolkit-relative files (no import — usable for shell scripts and launchers).
 * @param {string[]} relPaths
 * @returns {{skip: string} | {dir: string}}
 */
export function toolkitFiles(relPaths) {
  let dir;
  try {
    ({ dir } = locateToolkit());
  } catch (e) {
    return {
      skip: `requires a toolkit checkout (set AIOS_TOOLKIT_DIR): ${e.message}`,
    };
  }
  const missing = relPaths.filter((p) => !existsSync(path.join(dir, p)));
  if (missing.length) {
    return { skip: `toolkit at ${dir} lacks ${missing.join(", ")}` };
  }
  return { dir };
}

/**
 * Resolve a toolkit checkout and import the given toolkit-relative modules.
 * @param {string[]} relPaths toolkit-relative module paths (e.g. "scripts/analyze/aem.mjs")
 * @returns {Promise<{skip: string} | {dir: string, modules: Record<string, any>}>}
 *   `skip` carries the explicit skip message (no toolkit, or toolkit lacks the modules).
 */
export async function toolkitModules(relPaths) {
  let dir;
  try {
    ({ dir } = locateToolkit());
  } catch (e) {
    return {
      skip: `requires a toolkit checkout (set AIOS_TOOLKIT_DIR): ${e.message}`,
    };
  }
  const missing = relPaths.filter((p) => !existsSync(path.join(dir, p)));
  if (missing.length) {
    return { skip: `toolkit at ${dir} lacks ${missing.join(", ")}` };
  }
  const modules = {};
  for (const p of relPaths) {
    modules[p] = await import(pathToFileURL(path.join(dir, p)).href);
  }
  return { dir, modules };
}
