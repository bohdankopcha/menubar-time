import { buildSync } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const directory = mkdtempSync(join(tmpdir(), "menubar-time-tests-"));
try {
  const outfile = join(directory, "clocks.test.cjs");
  buildSync({ entryPoints: ["tests/clocks.test.ts"], outfile, bundle: true, platform: "node", format: "cjs" });
  const result = spawnSync(process.execPath, ["--test", outfile, "tests/register-raycast.test.mjs"], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
