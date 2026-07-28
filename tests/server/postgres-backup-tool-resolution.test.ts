import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const resolverPath = path.join(projectRoot, "deploy", "install", "postgres-backup-tools.sh");
const bashPath = resolveBashPath();

let fixtureRoot = "";

function source(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function toBashPath(value: string) {
  if (process.platform !== "win32") {
    return value;
  }

  return value
    .replace(/^([A-Za-z]):/, (_, drive: string) => `/${drive.toLowerCase()}`)
    .replaceAll("\\", "/");
}

function resolveBashPath() {
  if (process.platform !== "win32") {
    return "bash";
  }

  const candidates = [
    path.join(process.env.ProgramFiles ?? "C:\\Program Files", "Git", "bin", "bash.exe"),
    path.join(process.env.ProgramFiles ?? "C:\\Program Files", "Git", "usr", "bin", "bash.exe")
  ];
  const candidate = candidates.find((value) => existsSync(value));
  if (!candidate) {
    throw new Error("Git Bash is required for PostgreSQL backup resolver tests.");
  }
  return candidate;
}

function createClientPair(label: string, major: number) {
  const binDir = path.join(fixtureRoot, label);
  mkdirSync(binDir, { recursive: true });

  for (const tool of ["pg_dump", "pg_restore"]) {
    const filePath = path.join(binDir, tool);
    writeFileSync(
      filePath,
      `#!/usr/bin/env bash\nprintf '%s\\n' '${tool} (PostgreSQL) ${major}.14 (Ubuntu ${major}.14-0ubuntu0.24.04.1)'\n`,
      "utf8"
    );
    chmodSync(filePath, 0o755);
  }

  return binDir;
}

function runResolver(
  serverMajor: number,
  candidateDirs: string[],
  env: Partial<NodeJS.ProcessEnv> = {}
) {
  return spawnSync(
    bashPath,
    [toBashPath(resolverPath), String(serverMajor), ...candidateDirs.map(toBashPath)],
    {
    cwd: projectRoot,
    env: { ...process.env, ...env },
    encoding: "utf8"
    }
  );
}

beforeEach(() => {
  fixtureRoot = mkdtempSync(path.join(tmpdir(), "kmt-pg-tools-"));
});

afterEach(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

describe("PostgreSQL backup tool resolution", () => {
  it("prefers the exact server major even when an older pair is discovered first", () => {
    const version16 = createClientPair("version-16", 16);
    const version18 = createClientPair("version-18", 18);

    const result = runResolver(18, [version16, version18]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("POSTGRES_BACKUP_TOOL_MAJOR=18");
    expect(result.stdout).toContain(`PG_DUMP_BIN=${toBashPath(path.join(version18, "pg_dump"))}`);
    expect(result.stdout).toContain(`PG_RESTORE_BIN=${toBashPath(path.join(version18, "pg_restore"))}`);
  });

  it("uses the lowest matching pair newer than the server when no exact pair exists", () => {
    const version16 = createClientPair("version-16", 16);
    const version20 = createClientPair("version-20", 20);
    const version19 = createClientPair("version-19", 19);

    const result = runResolver(18, [version16, version20, version19]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("POSTGRES_BACKUP_TOOL_MAJOR=19");
    expect(result.stdout).toContain(`PG_DUMP_BIN=${toBashPath(path.join(version19, "pg_dump"))}`);
  });

  it("fails before deployment when only an older client pair exists", () => {
    const version16 = createClientPair("version-16", 16);

    const result = runResolver(18, [version16]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("postgresql-client-18");
    expect(result.stderr).toContain("POSTGRES_BACKUP_BIN_DIR");
    expect(result.stderr).not.toContain("DATABASE_URL");
  });

  it("honors a compatible explicit binary directory", () => {
    const version18 = createClientPair("version-18", 18);
    const version19 = createClientPair("version-19", 19);

    const result = runResolver(18, [version19], {
      POSTGRES_BACKUP_BIN_DIR: toBashPath(version18)
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`PG_DUMP_BIN=${toBashPath(path.join(version18, "pg_dump"))}`);
    expect(result.stdout).not.toContain(toBashPath(path.join(version19, "pg_dump")));
  });

  it("fails closed for an incompatible explicit binary directory", () => {
    const version16 = createClientPair("version-16", 16);
    const version18 = createClientPair("version-18", 18);

    const result = runResolver(18, [version18], {
      POSTGRES_BACKUP_BIN_DIR: toBashPath(version16)
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("POSTGRES_BACKUP_BIN_DIR");
    expect(result.stdout).not.toContain(toBashPath(path.join(version18, "pg_dump")));
  });

  it("queries the server and uses one selected pair for dump and archive validation", () => {
    const deploy = source("deploy/install/aapanel-pm2-update.sh");

    expect(deploy).toContain('require_command psql');
    expect(deploy).not.toContain('require_command pg_dump');
    expect(deploy).not.toContain('require_command pg_restore');
    expect(deploy).toContain('SHOW server_version_num');
    expect(deploy).toContain('source "${SCRIPT_DIR}/postgres-backup-tools.sh"');
    expect(deploy).toContain('"${PG_DUMP_BIN}" --dbname="${DATABASE_URL}"');
    expect(deploy).toContain('"${PG_RESTORE_BIN}" --list "${DATABASE_BACKUP_FILE}"');

    expect(() =>
      execFileSync(bashPath, [
        "-n",
        toBashPath(path.join(projectRoot, "deploy", "install", "aapanel-pm2-update.sh"))
      ])
    ).not.toThrow();
  });
});
