# Cut notes (AIO-594 bootstrap PR)

## Nightly inbox-authorization mutation floor — flagged for AIO-612 review

Core's nightly `inbox-authorization` mutation group (`scripts/run-mutation.mjs` in
`aiosbrain/aios-workspace`) mutates core's `src/operator-loop/inbox/capability.ts`,
but its **calibrated oracle** — the capability suite whose measured kill rate set the
90% floor — is `gui/server/runtime-adapters/inbox-capability.test.mjs`, which now
lives in **this** repo. Per the runbook (§7, bullet 2) and AIO-539's measured-decision
rules, core must either:

1. run this repo's capability suite from an installed gui checkout as the oracle, or
2. re-calibrate the 90% floor against a core-owned oracle (a measured decision,
   recorded with the evidence AIO-539 prescribes).

Nothing in this repo enforces or changes that floor; this note exists so the
**AIO-612 deletion PR review** (which removes the moved paths + gui CI lanes from
core) resolves it explicitly rather than letting the floor silently point at a suite
core no longer carries.

## Remaining provisional items

- ~~Remove the root `package.json` `overrides` entry and `vendor/aiosbrain-foundation-0.1.0.tgz`;
  reinstall from the registry and commit the refreshed `package-lock.json`.~~
  **Done** — `@aiosbrain/foundation@0.1.0` is published; the lockfile now resolves it
  from `registry.npmjs.org` and the vendored tarball is gone.
- The compiled operator loop is loaded from `<toolkit>/dist/operator-loop` (toolkit-dist
  fallback); replace with the published `@aios-alpha/operator-loop` package when it exists
  (runbook F7).

## CI follow-up (new-repo work, not this PR)

The bootstrap-seeded `.github/workflows/ci.yml` test job runs `npm run test` with no
toolkit checkout: the live-server suites will fail there with the toolkit-locate
actionable error (by design — the toolkit is a genuine prerequisite). The new repo's CI
must provision one (e.g. `actions/checkout` of `aiosbrain/aios-workspace` +
`AIOS_TOOLKIT_DIR`) before the test lane can be green end-to-end.
