import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { build } from "esbuild";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule() {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const os = await import("node:os");
  const temporary = await mkdtemp(path.join(os.tmpdir(), "grok-github-update-feed-"));
  const output = path.join(temporary, "github-update-feed.mjs");
  await build({
    entryPoints: [path.join(repoRoot, "source/electron-main/update/github-update-feed.ts")],
    outfile: output,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
  });
  const module = await import(`${pathToFileURL(output).href}?${Date.now()}`);
  return { module, dispose: () => rm(temporary, { recursive: true, force: true }) };
}

test("github feed targets this repo's releases", async () => {
  const loaded = await loadModule();
  try {
    const feed = loaded.module;
    assert.equal(feed.DEFAULT_GITHUB_UPDATE_BASE_URL, "https://api.github.com/repos/youming-ai/OpenGrokBot");
    assert.equal(feed.GITHUB_RELEASES_PAGE_URL, "https://github.com/youming-ai/OpenGrokBot/releases/latest");
    assert.equal(
      feed.buildGitHubUpdateRequestUrl("https://api.github.com/repos/youming-ai/OpenGrokBot/"),
      "https://api.github.com/repos/youming-ai/OpenGrokBot/releases/latest",
    );
    assert.equal(feed.isGitHubUpdateBaseUrl("https://api.github.com/repos/youming-ai/OpenGrokBot"), true);
    assert.equal(feed.isGitHubUpdateBaseUrl("https://api2.cursor.sh/updates"), false);
  } finally {
    await loaded.dispose();
  }
});

test("github release payload maps to a notify-style manifest", async () => {
  const loaded = await loadModule();
  try {
    const manifest = loaded.module.parseGitHubReleaseResponse({
      tag_name: "v0.18.0-reconstructed.2",
      name: "Reconstructed 0.18.0-2",
      html_url: "https://github.com/youming-ai/OpenGrokBot/releases/tag/v0.18.0-reconstructed.2",
    });
    assert.equal(manifest.version, "0.18.0-reconstructed.2");
    assert.equal(manifest.releasePage, "https://github.com/youming-ai/OpenGrokBot/releases/tag/v0.18.0-reconstructed.2");
    assert.throws(() => loaded.module.parseGitHubReleaseResponse({ tag_name: "", html_url: "https://example.com" }));
    assert.throws(() => loaded.module.parseGitHubReleaseResponse({ tag_name: "not-a-version", html_url: "https://example.com/x" }));
  } finally {
    await loaded.dispose();
  }
});
