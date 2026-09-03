# Contributing

Issues and pull requests are welcome. Keep changes reviewable, and never
commit generated application payloads, local credentials, recovered binary
material, or the original installer files.

Before opening a pull request, run:

```sh
bun install
bun run check
bun run frontend:build
```

On macOS, after `bun run bootstrap`, packaging changes should also pass:

```sh
bun run package
bun run verify
```

Use focused commits. Explain whether a change affects reviewed runtime source,
the editable frontend, the checksum-pinned packaged renderer, or packaging
only. Do not weaken checksum, bundle identity, code-signing, or clean-export
checks to make a build pass.

UI-facing reconstruction must follow the evidence rule in
[PROVENANCE.md](PROVENANCE.md): every recovered behavior needs an inspectable
artifact anchor, and speculative behavior is treated as a defect.