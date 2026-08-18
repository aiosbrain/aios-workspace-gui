# Licensing

AIOS Workspace GUI is open source, licensed under the **GNU Affero General Public License
v3.0 only** (`AGPL-3.0-only`). It is OSI-approved, and the FSF lists it as a free software
license.

Copyright (C) 2026 Chetan Nandakumar and John Ellison.

---

## What is under which license

| Path | License |
| --- | --- |
| Everything in this repository | `AGPL-3.0-only` |

There are no Apache-2.0 directories here. This repository is an **application** — a local
cockpit you run — rather than a library meant to be embedded in someone else's software,
so the permissive carve-outs that exist elsewhere in AIOS have nothing to apply to.

Prior releases were published under the MIT License. **They remain MIT** — the change is
going-forward only and takes nothing away. That text is preserved verbatim in
[`LICENSE-MIT`](LICENSE-MIT), including the original copyright notice, as the MIT License
requires.

---

## What this means for you

**Running the GUI is unrestricted.** It runs on your machine against your own workspace,
and the AGPL places no obligation on that — however much you modify it.

The AGPL's network clause is worth a word here, because it is the clause people worry
about: it is triggered by offering *network access to a modified version* to third
parties. A desktop cockpit you run locally does not do that. If you fork the GUI and host
it as a service for other people, then it applies.

**If your company's policy bans AGPL**, there is a free-of-charge commercial license for
internal use. See [`COMMERCIAL-LICENSE.md`](COMMERCIAL-LICENSE.md).

Longer answers: [`docs/LICENSING-FAQ.md`](docs/LICENSING-FAQ.md).

---

## The dependency-direction rule

Two licenses in one organization means one rule, and it only runs one way:

> **An Apache-2.0 package must never import from an AGPL-3.0 package.**
> Apache → AGPL is fine. AGPL → Apache is a license violation.

The reason is that the AGPL is contagious across a combined program and Apache-2.0 is not.
An AGPL module pulled into an Apache-2.0 package makes that package's Apache grant
undeliverable — we would be promising permissions on code we cannot grant them for. The
reverse is harmless: AGPL code may absorb Apache-2.0 code, and the result is AGPL.

The same rule holds across repositories in the `aiosbrain` organization. An Apache-2.0
repo may not depend on an AGPL-3.0 one.

Nothing in this repository may be imported by an Apache-2.0 package elsewhere in the
organization. It may itself depend on Apache-2.0 and other permissive code freely.

---

## Third-party components

[`NOTICE`](NOTICE) records the components carrying an attribution obligation, including
Tauri and the Rust crate tree under `src-tauri/`.

---

## Contributing

Contributions are accepted under `AGPL-3.0-only`. A Contributor License Agreement will be
introduced once our company is formed, at which point contributors will be asked to sign
one.
