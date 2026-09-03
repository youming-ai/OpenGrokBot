# Grok Bot 0.18 — reconstructed and extended

![Grok Bot Router settings with Codex selected and local usage totals](docs/assets/router-settings.png)

This repository is an unofficial, source-oriented reconstruction of the
publicly shipped Grok Bot 0.18.0 macOS app, published as open source for
research and study.

The project began as an attempt to understand how the desktop app was put
together. It now contains readable TypeScript implementations of its Electron,
host, coordinator, local-execution, protocol, and renderer boundaries, plus a
deterministic toolchain for turning those sources back into a working macOS
application.

It also adds a few practical experiments:

- an inference router for Cursor, Claude Code, Codex, and OpenRouter;
- Grok Bot plugin/MCP tools across the routed providers;
- local usage tracking for routed inference;
- an optional local Docker sandbox in place of the remote box; and
- a reconstructed settings surface integrated into the polished shipped UI.

This is a hacking and research project, not Anysphere's original monorepo and
not an official Grok Bot release. Names and module boundaries inferred from a
compiled application may differ from the original source. Read
[NOTICE.md](NOTICE.md) and [PROVENANCE.md](PROVENANCE.md) for the legal and
provenance boundaries that apply to this repository.

## What is in the repository?

The checked-in tree contains the reviewed reconstruction under `source/`, the
editable renderer under `frontend/`, build scripts, tests, manifests, and
documentation. It deliberately does **not** commit the extracted upstream
application, build output, local credentials, the large forensic recovery
workspace, or the original installer binaries.

The public Grok Bot 0.18.0 application is instead treated as a pinned build
input. During bootstrap, the toolchain downloads it from the official URL,
verifies its SHA-256 identity against the recorded checksums, and extracts the
pieces required to assemble the reconstruction.

The resulting app is a hybrid by design:

- application runtimes are compiled from the readable sources under `source/`;
- the polished shipped renderer remains the UI baseline;
- a narrow deterministic transform adds the reconstructed Router settings UI;
- original and patched renderer chunk hashes are recorded and verified; and
- the finished app uses a separate bundle identifier and an ad-hoc signature.

The upstream app installed on the machine is never overwritten.

### Why retain the shipped renderer?

The distributed application did not include the original frontend source or
source maps. It contained optimized, minified production JavaScript and CSS
chunks: enough to inspect behavior and recover contracts, but not the authored
React components, names, comments, file structure, or design-system source.

Recreating the complete frontend with the same polish and behavior would have
been a separate, much larger reverse-engineering project. It was not a realistic
goal for a weekend build. The practical choice was therefore to reconstruct the
runtime and control-plane code, retain the checksum-pinned shipped renderer,
and make the smallest auditable UI patch needed for the new Router settings.

`frontend/` is a readable partial reconstruction and design workspace. It is
useful for understanding UI contracts and experimenting with clean components,
but it should not be mistaken for Anysphere's missing original frontend source
or a pixel-perfect replacement for the packaged renderer.

## Original release inventory

The exact 0.18.0 installers are **not redistributed** with this repository.
Their identity is recorded instead, so any copy you fetch can be verified:

| Platform | File | SHA-256 |
| --- | --- | --- |
| macOS arm64 | `Grok_Bot_0.18.0.dmg` | `a253ccd8aab01e083f9812a0264354c5034d8ba7f0610bbb557e82ae77d203eb` |
| Windows x64 | `Grok_Bot_0.18.0_Setup.exe` | `464079a15ef5fa8b61ccea8fffcc78f63cfcf6df65fb0ad5e725d8b95f7e437e` |

See [research-archives/README.md](research-archives/README.md) for the source
URLs, sizes, download and verification commands, and the machine-readable
artifact manifest.

## Current features

### Inference Router

Open **Settings → Router** to choose the backend used for new turns:

| Provider | Authentication | Tool support |
| --- | --- | --- |
| Cursor | Existing Grok Bot/Cursor session | Native Grok Bot tools and plugins |
| Claude Code | Existing Claude Code login | Routed Grok Bot MCP tools |
| Codex | Existing local ChatGPT/Codex login | Direct Responses transport with Grok Bot tools |
| OpenRouter | API key saved through the desktop secrets bridge | Grok Bot tool-execution loop |

Cursor is the default. Claude Code and Codex do not require separate API keys
when their local clients are already authenticated. The application preserves
streaming responses, thinking state, reactions, rich plugin mentions, and MCP
tool execution across routed conversations.

**Usage & Billing** shows the locally recorded request and token totals for
providers that return usage data. These figures are activity records, not an
authoritative provider invoice.

### Local Docker sandbox

The Router page also has a **Use local Docker VM** toggle. When enabled, Grok
Bot runs its box host and execution daemon in an owned local container instead
of connecting to the remote sandbox.

The container:

- is bound only to loopback ports;
- mounts content-addressed host and daemon artifacts read-only;
- reuses the user's existing provider authentication where needed;
- is validated before the coordinator connects; and
- is stopped or replaced through the same settings lifecycle.

Docker Desktop, or another compatible local Docker daemon, must be running.
Remote mode remains the default.

## Requirements

- macOS on Apple Silicon
- Node.js 26.5.x
- bun 1.4.x (package manager; `bun.lock` committed)
- Xcode Command Line Tools
- Docker Desktop (optional, only for the local sandbox)
- local Claude Code or Codex authentication for those router choices

If a native build fails with `'functional' file not found`, the local Xcode
Command Line Tools install is missing its top-level libc++ headers. Reinstall
or update the tools, or export
`CPATH="$(xcrun --show-sdk-path)/usr/include/c++/v1"` for the build.

## Quick start

```sh
git clone https://github.com/youming-ai/OpenGrokBot.git
cd OpenGrokBot
bun install
bun run bootstrap
bun run check
bun run package
bun run package:dmg
open "dist/Grok Bot 0.18 Reconstructed.app"
```

This repo installs with [bun](https://bun.sh) (`packageManager: bun@1.4.0`,
`bun.lock` committed). Dependency lifecycle scripts are governed by the
`trustedDependencies` whitelist in `package.json` (`bun pm untrusted` must
report zero untrusted packages with scripts; `allowScripts`/`overrides` are
retained for compatibility). Build and test scripts themselves still run under
Node 26.5.x (see `.node-version`).

`bun run bootstrap` verifies a locally placed DMG first, then falls back to
downloading the pinned 0.18.0 DMG and verifying its SHA-256 identity before
use. The publisher retires old builds — the official 0.18.0 URL already
returns 403 — so set `GROK_BOT_018_DMG_URL` to a checksum-identical mirror
(CI uses the `upstream-0.18.0` release in this repo), keep a verified copy
under `research-archives/original/0.18.0/macos-arm64/` (see the
verification commands in [research-archives/README.md](research-archives/README.md))
or point `GROK_BOT_018_APP` at an existing application copy. Bootstrap then
caches the matching Electron runtime and hydrates the ignored `src/app/dist`
build input.

`bun run package` compiles the reconstructed runtimes, applies the narrow
renderer/settings transform, creates the app bundle, assigns the reconstructed
bundle identity, ad-hoc signs it, and verifies the result. `bun run
package:dmg` then wraps that verified bundle into a compressed disk image:

```text
dist/Grok Bot 0.18 Reconstructed.app
dist/Grok_Bot_0.18.0_Reconstructed.dmg
```

The bundle is ad-hoc signed under a separate bundle identifier, so Gatekeeper
blocks the first launch of a downloaded or copied build. Right-click the app
and choose **Open**, or clear the quarantine metadata with
`xattr -cr "dist/Grok Bot 0.18 Reconstructed.app"`. The official Grok Bot
installation on the machine is never touched.

Reconstructed packages repoint the updater at this repo's GitHub releases
(`SAND_UPDATE_FEED_BASE_URL` defaults to `api.github.com/repos/youming-ai/OpenGrokBot`;
a newer release surfaces as an "available" update that opens the release page)
and default upstream Sentry and telemetry emission off. `SAND_DISABLE_UPDATES=1`
still opts out, and explicitly supplied environment configuration is respected.

## Architecture

```text
polished shipped renderer
          │
          │ desktop preload / RPC
          ▼
     Electron main
          │
          ├── settings, secrets, auth and plugin lifecycle
          ├── remote box connector
          └── owned local Docker connector
                       │
                       ▼
              coordinator + host
                       │
               inference router
            ┌───────────┼───────────┐
         Cursor      Claude       Codex / OpenRouter
                       │
                 Grok Bot MCP tools
```

The main source areas are:

- `source/electron-main/` — desktop lifecycle, settings, auth, box connectors,
  coordinator ownership, and RPC handlers;
- `source/electron-preload/` — the narrow trusted bridge exposed to the UI;
- `source/host/` — inference, tools, MCP, settings, and turn execution;
- `source/node-agent-coordinator/` — transcript routing, streaming activity,
  reactions, and the routed MCP bridge;
- `source/shared/` — shared contracts, settings, protocol, and provider helpers;
- `frontend/` — readable React/TypeScript renderer reconstruction and design
  workspace;
- `scripts/` — bootstrap, compilation, renderer patching, packaging, signing,
  and verification; and
- `tests/` — publication and router regressions.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for more detail.

## Development commands

```sh
bun test                  # focused regression tests
bun run typecheck         # renderer TypeScript
bun run source:typecheck  # runtime TypeScript
bun run frontend:build    # build the readable renderer reconstruction
bun run package           # build, sign, and verify the macOS app
bun run package:dmg       # wrap the packaged app into dist/Grok_Bot_0.18.0_Reconstructed.dmg
bun run verify            # verify an existing packaged app
bun run smoke             # bounded native smoke check
bun run publication:check # prove a fresh export of the current commit is lossless
```

Generated directories including `.cache`, `.build`, `dist`, `src/app/dist`,
`recovered`, `recovery`, and local probe roots are ignored.

## Project status

The app launches and the core reconstructed flows are usable, including routed
inference, connected plugins, and the local Docker sandbox. This is still an
experimental reconstruction: it targets one pinned macOS/arm64 release, depends
on external provider sessions, and does not promise compatibility with future
Grok Bot versions.

The full build chain is verified locally on Apple Silicon (macOS 26.6, Node
26.5.0, bun 1.4.0): `bun run check` passes its 20 regressions, and packaging produces the
signed app bundle and disk image shown above.

For changes, read [CONTRIBUTING.md](CONTRIBUTING.md). Technical provenance and
retained upstream boundaries are described in [PROVENANCE.md](PROVENANCE.md)
and [NOTICE.md](NOTICE.md).

## License

The reconstructed source, build scripts, tests, and documentation written for
this repository are released under the MIT License — see [LICENSE](LICENSE).

This license covers only material written for this repository. It does not
cover the upstream Grok Bot application, its binary payload, trademarks, or
artwork, and the original installers are not redistributed here at all. Read
[NOTICE.md](NOTICE.md) before redistributing anything from this repository.