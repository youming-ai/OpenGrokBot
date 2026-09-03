# Publishing notes

This repository is published as a single root commit that contains the full
reviewed tree. Recovery reports, source capsules, extracted application
payloads, and local credentials are not part of the tree and were never part
of this history.

The original installer binaries are intentionally not redistributed. Bootstrap
downloads the pinned 0.18.0 DMG from the official URL and verifies its SHA-256
digest before use.

Before publishing changes:

1. Run `npm run publication:check`. It exports the current commit into a fresh
   directory and requires the exported tree to be identical to the committed
   one.
2. Run `npm ci`, `npm run bootstrap`, `npm run check`, `npm run package`, and
   `npm run verify` from a fresh clone.
3. Confirm `git status --ignored` shows no generated payload selected for Git.
4. Scan new commits for credentials and absolute machine paths.
5. Review `NOTICE.md`. The MIT license covers this repository's own material
   only; it does not cover the upstream application or its trademarks.