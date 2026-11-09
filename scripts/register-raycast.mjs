import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Use the SDK's registration lifecycle, then stop its watcher normally with SIGINT.
// `ray build` alone writes files but doesn't import a new extension into Raycast.
export async function registerRaycast({
  cliPath = join(dirname(require.resolve("@raycast/api/package.json")), "bin/run.js"),
  cwd = projectDirectory,
  settleDelay = 750,
  timeout = 60_000,
  output = process.stdout,
} = {}) {
  const child = spawn(process.execPath, [cliPath, "develop"], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NO_COLOR: "1" },
  });
  const exited = new Promise((done) => {
    child.once("exit", (code) => done(code));
    child.once("error", () => done(null));
  });
  let startupTimer;
  let settleTimer;
  try {
    await new Promise((done, fail) => {
      let log = "";
      let ready = false;
      startupTimer = setTimeout(() => fail(new Error("Raycast registration timed out.")), timeout);
      const consume = (chunk) => {
        output?.write(chunk);
        log = (log + chunk.toString().replace(/\x1b\[[0-9;]*m/g, "")).slice(-16_384);
        if (/\berror\s+-|\bError:|Build failed/i.test(log)) {
          fail(new Error("Registration failed. See the Raycast CLI output above."));
        } else if (!ready && log.includes("built extension successfully")) {
          ready = true;
          // The SDK debounces its build-success notification by 300 ms.
          settleTimer = setTimeout(done, settleDelay);
        }
      };
      child.stdout.on("data", consume);
      child.stderr.on("data", consume);
      child.once("error", fail);
      child.once("exit", (code) => fail(new Error(`Raycast CLI exited before registration finished (${code}).`)));
    });
  } finally {
    clearTimeout(startupTimer);
    clearTimeout(settleTimer);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGINT");
      let stopTimer;
      try {
        await Promise.race([
          exited,
          new Promise((_, fail) => {
            stopTimer = setTimeout(() => {
              child.kill("SIGKILL");
              fail(new Error("Raycast CLI did not stop normally; registration was interrupted."));
            }, 5000);
          }),
        ]);
      } finally {
        clearTimeout(stopTimer);
      }
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.platform !== "darwin") throw new Error("Menu Bar Time requires macOS.");
    await registerRaycast();
    console.log("Registered in Raycast. Development watcher stopped.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
