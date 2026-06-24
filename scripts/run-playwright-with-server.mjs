import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";

const host = process.env.KMT_HOST || "127.0.0.1";
const port = Number(process.env.KMT_PORT || 3000);
const baseUrl = `http://${host}:${port}`;
const playwrightArgs = ["test", ...process.argv.slice(2)];
let serverProcess = null;
let startedServer = false;
let finalExitCode = 0;

try {
  if (!(await isReady(`${baseUrl}/`))) {
    serverProcess = startNextDev();
    startedServer = true;
    await waitForServer(`${baseUrl}/`, 120_000);
  }

  finalExitCode = await runPlaywright(playwrightArgs);
} finally {
  if (startedServer && serverProcess?.pid) {
    await killProcessTree(serverProcess.pid);
  }
}

process.exit(finalExitCode);

function startNextDev() {
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "dev", "--hostname", host, "--port", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1"
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));
  return child;
}

function runPlaywright(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [playwrightCliPath(), ...args], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL || baseUrl
      },
      stdio: "inherit",
      windowsHide: true
    });

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

function playwrightCliPath() {
  return path.join(process.cwd(), "node_modules", "@playwright", "test", "cli.js");
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isReady(url)) {
      return;
    }
    await delay(500);
  }
  throw new Error(`Server did not become ready at ${url}`);
}

function isReady(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(Boolean(response.statusCode && response.statusCode < 500));
    });

    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function killProcessTree(pid) {
  if (process.platform !== "win32") {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        return Promise.resolve();
      }
    }
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const child = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true
    });
    child.on("exit", () => resolve());
    child.on("error", () => resolve());
  });
}
