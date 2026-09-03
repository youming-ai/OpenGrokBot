# Security notes

This is an experimental reconstruction published for research, not a supported
production distribution. Do not reuse real credentials or sensitive accounts
while experimenting with it.

Reconstructed packages repoint the updater at this repo's GitHub releases and
default upstream Sentry and telemetry off at the Electron-main packaging
boundary. The bootstrap download and hydrated `app.asar` are checksum-pinned.

`npm audit` still reports compatibility-bound advisories in the pinned Electron
42.1 runtime, Undici 5 / Connect 1 stack, AI SDK 4, and OpenTelemetry stack.
Patch-level fixes are applied where they do not change reconstructed runtime
contracts. The remaining major upgrades are intentionally tracked as follow-up
work rather than silently changing application behavior.

Please report vulnerabilities privately through GitHub's "Report a
vulnerability" feature for this repository, or by contacting the repository
owner directly, rather than opening a public issue against this experimental
codebase.