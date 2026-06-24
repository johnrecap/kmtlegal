import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "stitch_kmt_legal_platform_ui_system");
const outputDir = path.join(root, "public", "stitch-assets");
const manifestFile = path.join(outputDir, "manifest.json");
const urlPattern = /https:\/\/lh3\.googleusercontent\.com\/aida-public\/[A-Za-z0-9_-]+/g;

function collectCodeHtmlFiles(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      return collectCodeHtmlFiles(fullPath);
    }
    return entry.isFile() && entry.name === "code.html" ? [fullPath] : [];
  });
}

function collectAssetUrls() {
  const urls = new Set();
  for (const htmlFile of collectCodeHtmlFiles(sourceRoot)) {
    const html = fs.readFileSync(htmlFile, "utf8");
    for (const match of html.matchAll(urlPattern)) {
      urls.add(match[0]);
    }
  }
  return [...urls].sort();
}

function extensionFromContentType(contentType = "") {
  if (contentType.includes("png")) {
    return "png";
  }
  if (contentType.includes("webp")) {
    return "webp";
  }
  return "jpg";
}

function download(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error(`Too many redirects for ${url}`));
      return;
    }

    https.get(url, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode || 0) && response.headers.location) {
        response.resume();
        resolve(download(new URL(response.headers.location, url).toString(), redirectCount + 1));
        return;
      }

      if ((response.statusCode || 0) < 200 || (response.statusCode || 0) >= 300) {
        response.resume();
        reject(new Error(`Failed ${url}: HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: response.headers["content-type"] || ""
        });
      });
    }).on("error", reject);
  });
}

function loadManifest() {
  if (!fs.existsSync(manifestFile)) {
    return { assets: {} };
  }
  return JSON.parse(fs.readFileSync(manifestFile, "utf8"));
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const manifest = loadManifest();
  const urls = collectAssetUrls();

  for (const url of urls) {
    const existing = manifest.assets[url];
    if (existing?.file && fs.existsSync(path.join(root, existing.file))) {
      console.log(`kept ${existing.file}`);
      continue;
    }

    const { buffer, contentType } = await download(url);
    const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 16);
    const fileName = `${hash}.${extensionFromContentType(contentType)}`;
    const relativeFile = path.join("public", "stitch-assets", fileName).replaceAll("\\", "/");
    const outputPath = path.join(root, relativeFile);

    fs.writeFileSync(outputPath, buffer);
    manifest.assets[url] = {
      file: relativeFile,
      publicPath: `/stitch-assets/${fileName}`,
      contentType,
      bytes: buffer.length
    };
    console.log(`downloaded ${relativeFile}`);
  }

  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`localized ${Object.keys(manifest.assets).length} Stitch assets.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
