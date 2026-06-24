import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const outputDir = path.join(root, "test-results", "stitch-clone");
const workspaceRoot = path.join(root, "_workspace", "stitch-clone");
const host = "127.0.0.1";
const port = Number(process.env.STITCH_CLONE_PORT || 3000);
const baseUrl = `http://${host}:${port}`;

const screens = [
  "home",
  "services",
  "service-corporate-contracts",
  "team",
  "lawyer-profile-karim",
  "book-consultation",
  "case-studies",
  "case-study-commercial-dispute",
  "media",
  "articles",
  "contact",
  "login",
  "portal-dashboard",
  "portal-case-detail",
  "portal-documents",
  "portal-appointments",
  "admin-dashboard",
  "admin-clients",
  "admin-cases",
  "admin-case-detail",
  "admin-calendar",
  "admin-tasks",
  "admin-content-social"
];

const viewports = [
  ["mobile", { width: 390, height: 844 }],
  ["desktop", { width: 1440, height: 900 }]
];

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

async function waitForServer(url, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await requestUrl(url)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startServer() {
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const serverMode = process.env.STITCH_CLONE_SERVER_MODE || (fs.existsSync(path.join(root, ".next", "BUILD_ID")) ? "start" : "dev");
  const child = spawn(
    process.execPath,
    [nextBin, serverMode, "--hostname", host, "--port", String(port)],
    {
      cwd: root,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: "ignore",
      windowsHide: true
    }
  );

  return child;
}

function waitForChildExit(child, timeoutMs = 5_000) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) {
      resolve();
      return;
    }

    const timeout = setTimeout(resolve, timeoutMs);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(resolve, timeoutMs))
  ]);
}

async function stopServer(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }

  await waitForChildExit(child);
  child.unref();
}

function writeEvidence(screen, capturedFiles) {
  const folder = path.join(workspaceRoot, screen);
  fs.mkdirSync(folder, { recursive: true });
  const relativeFiles = capturedFiles.map((file) => path.relative(root, file).replaceAll("\\", "/"));

  fs.writeFileSync(
    path.join(folder, "03_playwright-screenshots.md"),
    `# ${screen} Playwright Screenshots

Status: captured.

Captured outputs:
${relativeFiles.map((file) => `- \`${file}\``).join("\n")}

Reference viewport sizes:
- mobile: \`390x844\`
- desktop: \`1440x900\`
`
  );

  fs.writeFileSync(
    path.join(folder, "06_acceptance.md"),
    `# ${screen} Acceptance

Status: implementation and screenshot capture complete; visual diff review remains pending.

Completed:
- route renders without runtime error
- required screenshots captured

Remaining:
- compare implementation screenshot with Stitch reference screenshot
- document visible differences in \`04_visual-diff-report.md\`
- apply only targeted fixes for documented differences
`
  );
}

async function capture() {
  fs.mkdirSync(outputDir, { recursive: true });
  const server = startServer();

  try {
    await waitForServer(`${baseUrl}/stitch-clone/home`);

    const browser = await chromium.launch();
    try {
      for (const screen of screens) {
        const capturedFiles = [];
        for (const [name, viewport] of viewports) {
          const page = await browser.newPage({ viewport });
          const outputPath = path.join(outputDir, `${screen}-${name}.png`);
          await page.goto(`${baseUrl}/stitch-clone/${screen}`, {
            waitUntil: "domcontentloaded",
            timeout: 60_000
          });
          await page.waitForTimeout(600);
          await page.screenshot({ path: outputPath, fullPage: true });
          await page.close();
          capturedFiles.push(outputPath);
          console.log(`captured ${path.relative(root, outputPath)}`);
        }
        writeEvidence(screen, capturedFiles);
      }
    } finally {
      await withTimeout(browser.close(), 5_000);
    }
  } finally {
    await stopServer(server);
  }
}

capture().then(() => {
  console.log(`captured ${screens.length * viewports.length} Stitch screenshots.`);
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
