import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules", "coverage", "playwright-report", "test-results", "_workspace"]);
const ignoredFiles = new Set(["package-lock.json"]);
const textExtensions = new Set([
  ".cjs",
  ".css",
  ".env",
  ".example",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".prisma",
  ".sql",
  ".tsx",
  ".ts",
  ".txt",
  ".yml",
  ".yaml"
]);

const patterns = [
  { name: "private key", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "OpenAI-style API key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "hardcoded production database URL", regex: /DATABASE_URL\s*=\s*postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/ },
  { name: "hardcoded SMTP password", regex: /SMTP_PASSWORD\s*=\s*(?!\s*(replace|placeholder|example|changeme|change_me|$))/i }
];

const findings = [];
scanDirectory(root);

if (findings.length > 0) {
  console.error("[security:secrets] Potential secrets found:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.name}`);
  }
  process.exit(1);
}

console.log("[security:secrets] No high-confidence secret patterns found.");

function scanDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        scanDirectory(path.join(directory, entry.name));
      }
      continue;
    }

    if (!entry.isFile() || ignoredFiles.has(entry.name)) {
      continue;
    }

    const filePath = path.join(directory, entry.name);
    const extension = path.extname(entry.name);
    if (!textExtensions.has(extension) && !entry.name.startsWith(".env")) {
      continue;
    }

    scanFile(filePath);
  }
}

function scanFile(filePath) {
  const relativePath = path.relative(root, filePath).replaceAll(path.sep, "/");
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.regex.test(line) && !isAllowedExample(relativePath, line)) {
        findings.push({ file: relativePath, line: index + 1, name: pattern.name });
      }
    }
  });
}

function isAllowedExample(relativePath, line) {
  if (relativePath === ".env.example" || relativePath.endsWith(".example")) {
    return true;
  }

  if (relativePath.endsWith(".md") && /placeholder|example|env name|must be configured|local|dev/i.test(line)) {
    return true;
  }

  return false;
}
