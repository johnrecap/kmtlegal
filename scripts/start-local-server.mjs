import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const host = process.env.KMT_HOST || "127.0.0.1";
const port = Number(process.env.KMT_PORT || 3000);
const baseUrl = `http://${host}:${port}`;
const logsDir = path.join(root, "_workspace", "server-logs");
const pidFile = path.join(logsDir, "next-start.pid");
const stdoutFile = path.join(logsDir, "next-start.out.log");
const stderrFile = path.join(logsDir, "next-start.err.log");

function requestUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await requestUrl(url)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function main() {
  fs.mkdirSync(logsDir, { recursive: true });

  if (await requestUrl(`${baseUrl}/stitch-clone/home`)) {
    console.log(`already running: ${baseUrl}/stitch-clone/home`);
    return;
  }

  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const stdout = fs.openSync(stdoutFile, "a");
  const stderr = fs.openSync(stderrFile, "a");
  const child = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", host, "--port", String(port)],
    {
      cwd: root,
      detached: true,
      stdio: ["ignore", stdout, stderr],
      windowsHide: true,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1"
      }
    }
  );

  child.unref();
  fs.writeFileSync(pidFile, `${child.pid}\n`);

  if (!(await waitForServer(`${baseUrl}/stitch-clone/home`))) {
    console.error(`server did not become ready. pid=${child.pid}`);
    console.error(`stdout: ${stdoutFile}`);
    console.error(`stderr: ${stderrFile}`);
    process.exit(1);
  }

  console.log(`started pid=${child.pid}`);
  console.log(`${baseUrl}/stitch-clone/home`);
  console.log(`stdout: ${stdoutFile}`);
  console.log(`stderr: ${stderrFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
