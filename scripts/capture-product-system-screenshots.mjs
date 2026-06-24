import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const host = "127.0.0.1";
const port = Number(process.env.PRODUCT_SYSTEM_PORT || 3001);
const baseUrl = `http://${host}:${port}`;
const outputDir = path.join(root, "test-results", "product-system");
const pages = [
  ["dashboard", "/product-system"],
  ["clients", "/product-system/clients"],
  ["cases", "/product-system/cases"],
  ["documents", "/product-system/documents"],
  ["settings", "/product-system/settings"]
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

async function waitForServer(url, timeoutMs = 60_000) {
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
  return spawn(process.execPath, [nextBin, "start", "--hostname", host, "--port", String(port)], {
    cwd: root,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: "ignore",
    windowsHide: true
  });
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
  child.unref();
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const server = startServer();

  try {
    await waitForServer(`${baseUrl}/product-system`);
    const browser = await chromium.launch();
    try {
      for (const [screenName, routePath] of pages) {
        for (const [viewportName, viewport] of [
          ["mobile", { width: 390, height: 844 }],
          ["desktop", { width: 1440, height: 900 }]
        ]) {
          const page = await browser.newPage({ viewport });
          const outputPath = path.join(outputDir, `product-system-${screenName}-${viewportName}.png`);
          await page.goto(`${baseUrl}${routePath}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
          await page.waitForTimeout(600);
          await page.screenshot({ path: outputPath, fullPage: true });
          await page.close();
          console.log(`captured ${path.relative(root, outputPath)}`);
        }
      }
    } finally {
      await browser.close();
    }
  } finally {
    await stopServer(server);
  }
}

main().then(() => {
  console.log("captured product system screenshots.");
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
