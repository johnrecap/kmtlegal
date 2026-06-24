import { spawn } from "node:child_process";
import path from "node:path";

const includeE2e = process.argv.includes("--include-e2e");
const includeDb = process.argv.includes("--include-db");
const includeSecurityAudit = process.argv.includes("--include-security-audit");
const includeSecretScan = process.argv.includes("--include-secret-scan");
const releaseGate = process.argv.includes("--release-gate");
const localReleaseCandidate = process.argv.includes("--local-release-candidate");

const baseChecks = [
  ["npm", ["run", "db:validate"]],
  ["npm", ["run", "db:generate"]],
  ["npm", ["run", "typecheck"]],
  ["npm", ["run", "lint"]],
  ["npm", ["run", "test"]],
  ["npm", ["run", "build"]]
];

const optionalChecks = [];

if (localReleaseCandidate) {
  console.warn("[plan23] qa:local:release is a local release-candidate check only; it does not close VPS production readiness.");
}

if (releaseGate) {
  console.log("[plan23] qa:release includes DB, E2E, security audit, and secret scan gates.");
}

if (includeE2e) {
  optionalChecks.push(["npm", ["run", "test:e2e:smoke"]]);
}

if (includeDb) {
  if (!process.env.DATABASE_URL) {
    throw new Error("qa:db/qa:release requires DATABASE_URL to point at a real PostgreSQL database.");
  }

  optionalChecks.push(["npm", ["run", "db:migrate"]]);
  optionalChecks.push(["npm", ["run", "db:seed"]]);
  optionalChecks.push(["npm", ["run", "db:seed"]]);
  optionalChecks.push(["npm", ["run", "test:e2e:db"]]);
}

if (includeSecurityAudit) {
  optionalChecks.push(["npm", ["run", "security:audit"]]);
}

if (includeSecretScan) {
  optionalChecks.push(["npm", ["run", "security:secrets"]]);
}

for (const [command, args] of [...baseChecks, ...optionalChecks]) {
  await run(command, args);
}

function run(command, args) {
  const invocation = command === "npm" ? npmInvocation(args) : { executable: command, args };
  const label = `${command} ${args.join(" ")}`;
  console.log(`\n[plan23] ${label}`);

  return new Promise((resolve, reject) => {
    const child = spawn(invocation.executable, invocation.args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1"
      },
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

function npmInvocation(args) {
  const npmCli =
    process.env.npm_execpath ||
    path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");

  return {
    executable: process.execPath,
    args: [npmCli, ...args]
  };
}
