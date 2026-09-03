import { existsSync } from "node:fs";
import { rm, stat } from "node:fs/promises";
import path from "node:path";
import { outputApp, outputDir, reconstructedName } from "./lib/config.mjs";
import { run } from "./lib/process.mjs";
import { SYSTEM_TOOLS } from "./lib/system-tools.mjs";

if (process.platform !== "darwin") {
  throw new Error("The reconstructed macOS disk image can only be created on macOS.");
}

if (!existsSync(outputApp)) {
  throw new Error(`Missing packaged application: ${outputApp}. Run \`npm run package\` first.`);
}

// Wrap the already verified, ad-hoc signed reconstructed application into a
// compressed read-only disk image. The app bundle is copied untouched, so the
// signature verification performed by `npm run package` still applies.
const outputDmg = path.join(outputDir, "Grok_Bot_0.18.0_Reconstructed.dmg");
await rm(outputDmg, { force: true });
await run(SYSTEM_TOOLS.hdiutil, [
  "create",
  "-volname",
  reconstructedName,
  "-srcfolder",
  outputApp,
  "-format",
  "UDZO",
  "-fs",
  "HFS+",
  "-ov",
  outputDmg,
]);
await run(SYSTEM_TOOLS.hdiutil, ["verify", outputDmg]);

const { size } = await stat(outputDmg);
console.log(`Packaged disk image: ${outputDmg} (${(size / 1024 / 1024).toFixed(1)} MB)`);