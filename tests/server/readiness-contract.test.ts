import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { databaseReadinessChecks, readinessSummary } from "@/server/health/runtime-readiness";
import { productionReadinessIssues } from "@/server/config/production-readiness";

function prismaFixture(overrides: {
  queryFails?: boolean;
  roleExists?: boolean;
  activeSuperAdminCount?: number;
  installerCompleted?: boolean;
} = {}) {
  return {
    $queryRaw: vi.fn(async () => {
      if (overrides.queryFails) {
        throw new Error("db down");
      }
      return [{ ok: 1 }];
    }),
    role: {
      findUnique: vi.fn(async () => (overrides.roleExists === false ? null : { id: "role_super_admin" }))
    },
    user: {
      count: vi.fn(async () => overrides.activeSuperAdminCount ?? 1)
    },
    systemSetting: {
      findUnique: vi.fn(async () => (overrides.installerCompleted === false ? null : { id: "setting_installer_completed" }))
    }
  };
}

describe("runtime readiness contract", () => {
  it("reports database connection failure as blocking readiness checks", async () => {
    const checks = await databaseReadinessChecks({
      requireBootstrap: true,
      prismaClient: prismaFixture({ queryFails: true }) as never
    });

    expect(readinessSummary(checks).ready).toBe(false);
    expect(checks.map((check) => check.id)).toEqual(
      expect.arrayContaining(["database.connection", "database.schema", "database.seed", "installer.bootstrap", "installer.lock"])
    );
  });

  it("blocks installer preflight when required seed rows are missing", async () => {
    const checks = await databaseReadinessChecks({
      requireBootstrap: false,
      prismaClient: prismaFixture({ roleExists: false }) as never
    });

    expect(readinessSummary(checks).ready).toBe(false);
    expect(checks.find((check) => check.id === "database.seed")).toMatchObject({
      ok: false,
      blocking: true
    });
  });

  it("requires first admin, installer completion, and installer lock for production app readiness", async () => {
    const previousInstallerEnabled = process.env.INSTALLER_ENABLED;
    const previousInstallerLockPath = process.env.INSTALLER_LOCK_PATH;
    const lockDir = await fs.mkdtemp(path.join(os.tmpdir(), "kmt-readiness-"));
    const lockPath = path.join(lockDir, "install.lock");

    process.env.INSTALLER_ENABLED = "false";
    process.env.INSTALLER_LOCK_PATH = lockPath;
    await fs.writeFile(lockPath, "{}");

    try {
      const checks = await databaseReadinessChecks({
        requireBootstrap: true,
        prismaClient: prismaFixture() as never
      });

      expect(readinessSummary(checks).ready).toBe(true);
    } finally {
      if (previousInstallerEnabled === undefined) {
        Reflect.deleteProperty(process.env, "INSTALLER_ENABLED");
      } else {
        process.env.INSTALLER_ENABLED = previousInstallerEnabled;
      }

      if (previousInstallerLockPath === undefined) {
        Reflect.deleteProperty(process.env, "INSTALLER_LOCK_PATH");
      } else {
        process.env.INSTALLER_LOCK_PATH = previousInstallerLockPath;
      }

      await fs.rm(lockDir, { recursive: true, force: true });
    }
  });

  it("rejects placeholder production database URLs", () => {
    const issues = productionReadinessIssues({
      APP_ENV: "production",
      NODE_ENV: "production",
      APP_ORIGIN: "https://kmt.example",
      AUTH_SECRET: "0123456789abcdef0123456789abcdef",
      DATABASE_URL: "postgresql://CHANGE_ME",
      SESSION_COOKIE_SECURE: "true",
      CSRF_STRICT_ORIGIN: "true",
      STORAGE_DRIVER: "vps-filesystem",
      UPLOADS_DIR: "/var/lib/kmt-legal/uploads",
      MAX_UPLOAD_MB: "5",
      ALLOWED_UPLOAD_TYPES:
        "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png",
      SMTP_ENABLED: "false",
      STAFF_2FA_MODE: "disabled",
      INSTALLER_ENABLED: "false",
      AI_PROVIDER: "mock",
      ANALYTICS_ENABLED: "true"
    });

    expect(issues.map((issue) => issue.code)).toContain("DATABASE_URL_REQUIRED");
  });
});
