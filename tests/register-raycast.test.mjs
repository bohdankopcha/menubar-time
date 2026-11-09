import { strict as assert } from "node:assert";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { registerRaycast } from "../scripts/register-raycast.mjs";

test("registration stops the development process after a successful build", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "menubar-registration-"));
  try {
    const cliPath = join(cwd, "fake-cli.cjs");
    writeFileSync(cliPath, `
      require('node:fs').writeFileSync('started', process.argv[2]);
      process.on('SIGINT', () => {
        require('node:fs').writeFileSync('stopped', 'yes');
        process.exit(0);
      });
      console.log('ready  - built extension successfully');
      setInterval(() => {}, 1000);
    `);
    await registerRaycast({ cwd, cliPath, settleDelay: 10, output: null });
    assert.equal(readFileSync(join(cwd, "started"), "utf8"), "develop");
    assert.equal(readFileSync(join(cwd, "stopped"), "utf8"), "yes");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("registration reports build failures and still stops the watcher", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "menubar-registration-failure-"));
  try {
    const cliPath = join(cwd, "fake-cli.cjs");
    writeFileSync(cliPath, `
      process.on('SIGINT', () => {
        require('node:fs').writeFileSync('stopped', 'yes');
        process.exit(0);
      });
      console.error('Error: Build failed');
      setInterval(() => {}, 1000);
    `);
    await assert.rejects(registerRaycast({ cwd, cliPath, output: null }), /Registration failed/);
    assert.ok(existsSync(join(cwd, "stopped")));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
