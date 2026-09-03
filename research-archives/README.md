# Original release inventory

This directory documents the publicly distributed Grok Bot 0.18.0 installers
used by the reconstruction. The binaries themselves are **not redistributed**
with this repository; only their recorded identity is tracked.

## Artifacts

| Platform | Architecture | Bytes | SHA-256 | Original URL |
| --- | --- | ---: | --- | --- |
| macOS | arm64 | 155,793,020 | `a253ccd8aab01e083f9812a0264354c5034d8ba7f0610bbb557e82ae77d203eb` | `https://downloads.cursor.com/grokbot/stable/darwin-arm64/0.18.0/Grok_Bot_0.18.0.dmg` |
| Windows | x64 | 125,825,552 | `464079a15ef5fa8b61ccea8fffcc78f63cfcf6df65fb0ad5e725d8b95f7e437e` | `https://downloads.cursor.com/grokbot/stable/win32-x64/0.18.0/Grok_Bot_0.18.0_Setup.exe` |

## Fetching and verification

Download the installers from the recorded official URLs, place them under the
paths below, and verify them against the pinned digests:

```sh
mkdir -p research-archives/original/0.18.0/macos-arm64 \
         research-archives/original/0.18.0/windows-x64
curl -L -o research-archives/original/0.18.0/macos-arm64/Grok_Bot_0.18.0.dmg \
  https://downloads.cursor.com/grokbot/stable/darwin-arm64/0.18.0/Grok_Bot_0.18.0.dmg
curl -L -o research-archives/original/0.18.0/windows-x64/Grok_Bot_0.18.0_Setup.exe \
  https://downloads.cursor.com/grokbot/stable/win32-x64/0.18.0/Grok_Bot_0.18.0_Setup.exe
(cd research-archives/original/0.18.0 && shasum -a 256 -c SHA256SUMS)
```

`npm run bootstrap` also works without these files: it downloads the DMG from
the official URL itself and verifies the same pinned digest before use. When a
verified local copy is present, bootstrap prefers it over the network.

`artifacts.json` is the machine-readable source, size, and digest inventory.
These records are preservation metadata, not reconstructed build outputs.