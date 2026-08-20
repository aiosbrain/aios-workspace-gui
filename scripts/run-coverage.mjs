#!/usr/bin/env node
/**
 * Produce ONE repo-level coverage artifact for this multi-package repo.
 *
 *   coverage/coverage-summary.json   (Istanbul json-summary)
 *   coverage/lcov.info
 *
 * Those two paths are exactly what the Team Brain ingestion scanner reads
 * (`aios_ingest/analyzers/codebase.py::_read_coverage`) to fill `test_coverage_pct`.
 * Without them this repo reports coverage as `null` and the Codebases dashboard shows
 * "—" forever — which is what it did before AIO-678's scan-on-merge.yml gained a root
 * `test:coverage` script to call.
 *
 * Two independent report producers feed the artifact:
 *   - root  : c8 over the Node suite (gui/server + test/skill-*) -> coverage/root
 *   - client: Vitest v8 coverage in gui/client            -> gui/client/coverage
 *
 * The client report is OPTIONAL. `gui/client` is a workspace that can be absent or
 * broken; a hard requirement here would mean no artifact at all, i.e. the same
 * null-coverage outcome this script exists to fix.
 *
 * This is a METRICS SOURCE, not a gate. It writes no baseline and enforces no
 * threshold. It still exits nonzero when the underlying suites fail, but the artifact
 * is written first so a failing test never silently deletes the number.
 */
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const C8 = path.join(ROOT, "node_modules", "c8", "bin", "c8.js");
const METRICS = ["lines", "statements", "functions", "branches"];

const ROOT_SUMMARY = path.join(ROOT, "coverage", "root", "coverage-summary.json");
const ROOT_LCOV = path.join(ROOT, "coverage", "root", "lcov.info");
const CLIENT_DIR = path.join(ROOT, "gui", "client");
const CLIENT_SUMMARY = path.join(CLIENT_DIR, "coverage", "coverage-summary.json");
const CLIENT_LCOV = path.join(CLIENT_DIR, "coverage", "lcov.info");
const OUT_SUMMARY = path.join(ROOT, "coverage", "coverage-summary.json");
const OUT_LCOV = path.join(ROOT, "coverage", "lcov.info");

// The same file list `npm run test:server` and `npm run test:skill-library` run. Kept
// here rather than shelling out to those scripts so c8 wraps ONE node process and the
// raw V8 data lands in one place.
const SUITE = [
  "--test",
  "gui/server/**/*.test.mjs",
  "test/skill-install.test.mjs",
  "test/skill-install-marketplace.test.mjs",
];

function execute(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        PATH: [path.join(ROOT, "node_modules", ".bin"), process.env.PATH]
          .filter(Boolean)
          .join(path.delimiter),
      },
      ...options,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited ${signal ? `with ${signal}` : `with status ${code}`}`));
    });
  });
}

/** Sum two json-summary `total` blocks. */
export function mergeTotals(a, b) {
  const merged = {};
  for (const metric of METRICS) {
    const covered = (a?.[metric]?.covered ?? 0) + (b?.[metric]?.covered ?? 0);
    const skipped = (a?.[metric]?.skipped ?? 0) + (b?.[metric]?.skipped ?? 0);
    const total = (a?.[metric]?.total ?? 0) + (b?.[metric]?.total ?? 0);
    merged[metric] = {
      total,
      covered,
      skipped,
      pct: total === 0 ? 100 : Number(((covered / total) * 100).toFixed(2)),
    };
  }
  return merged;
}

/**
 * Namespace one report's per-file keys before the spread that merges them (AIO-514).
 *
 * Both reports are written relative to their OWN package root, so `src/index.ts` exists
 * in each. A bare `{...root, ...client}` spread silently drops one side's row: the totals
 * stay right, only the per-file rows are wrong, which is precisely why it went unnoticed
 * in aios-workspace. Prefixing one side makes the collision impossible; absolute keys and
 * `total` are left alone.
 */
export function prefixSummaryFiles(summary, prefix) {
  const out = {};
  for (const [file, entry] of Object.entries(summary)) {
    if (file === "total") continue;
    const absolute = file.startsWith("/") || /^[A-Za-z]:[\\/]/.test(file);
    out[absolute || !prefix ? file : `${prefix}/${file}`] = entry;
  }
  return out;
}

/** The lcov equivalent of `prefixSummaryFiles`. */
export function prefixRelativeLcov(text, prefix) {
  return text.replace(/^SF:(.+)$/gm, (_line, file) =>
    file.startsWith("/") || /^[A-Za-z]:[\\/]/.test(file) ? `SF:${file}` : `SF:${prefix}/${file}`
  );
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function merge() {
  if (!existsSync(ROOT_SUMMARY)) {
    throw new Error(`run-coverage: missing required report: ${ROOT_SUMMARY}`);
  }
  const rootReport = readJson(ROOT_SUMMARY);
  const hasClient = existsSync(CLIENT_SUMMARY);
  const clientReport = hasClient ? readJson(CLIENT_SUMMARY) : null;

  const total = mergeTotals(rootReport.total, clientReport?.total);
  const merged = {
    ...prefixSummaryFiles(rootReport, ""),
    ...(clientReport ? prefixSummaryFiles(clientReport, "gui/client") : {}),
    total,
  };
  writeFileSync(OUT_SUMMARY, `${JSON.stringify(merged, null, 2)}\n`);

  writeFileSync(OUT_LCOV, existsSync(ROOT_LCOV) ? readFileSync(ROOT_LCOV, "utf8") : "");
  if (hasClient && existsSync(CLIENT_LCOV)) {
    appendFileSync(OUT_LCOV, `\n${prefixRelativeLcov(readFileSync(CLIENT_LCOV, "utf8"), "gui/client")}`);
  }

  console.log(
    `run-coverage: lines ${total.lines.pct}% · branches ${total.branches.pct}% · ` +
      `${Object.keys(merged).length - 1} production files` +
      (hasClient ? "" : " (root only — no gui/client report)")
  );
}

async function main() {
  rmSync(path.join(ROOT, "coverage"), { recursive: true, force: true });
  rmSync(path.join(CLIENT_DIR, "coverage"), { recursive: true, force: true });
  mkdirSync(path.join(ROOT, "coverage"), { recursive: true });

  // The client pass is deferred, not fatal: a broken/absent client must not destroy the
  // root number, and the failure is still re-thrown after the artifact is written.
  let clientError = null;
  if (existsSync(path.join(CLIENT_DIR, "package.json"))) {
    try {
      await execute("npm", ["--prefix", "gui/client", "run", "test:coverage"]);
    } catch (error) {
      clientError = error;
      console.error(
        `run-coverage: gui/client coverage FAILED (${error.message}) — continuing so the ` +
          "root artifact is still produced; re-thrown after the merge."
      );
    }
  } else {
    console.log("run-coverage: skipping gui/client coverage (root only — no gui/client manifest)");
  }

  // c8 writes its report even when the wrapped process exits nonzero, so produce the
  // artifact FIRST and propagate the suite failure after. Coupling them is how
  // aios-workspace lost its coverage number entirely: one failing test threw, the merge
  // never ran, and the scanner pushed `test_coverage_pct: null`.
  let suiteError = null;
  try {
    await execute(process.execPath, [C8, process.execPath, ...SUITE]);
  } catch (error) {
    suiteError = error;
  }

  try {
    merge();
  } catch (mergeError) {
    if (!suiteError) throw mergeError;
    console.error(`run-coverage: artifact unavailable after suite failure: ${mergeError.message}`);
  }

  if (suiteError) throw suiteError;
  if (clientError) throw clientError;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
