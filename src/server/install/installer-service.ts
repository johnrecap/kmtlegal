import { timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { appendAuditLog } from "@/server/audit/audit-service";
import { hashPassword } from "@/server/auth/password";
import { ROLES } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { type HostingMode, panelPreflightChecks } from "@/server/install/panel-preflight";
import { emailSchema, localeSchema, parseWithSchema } from "@/server/validation/schemas";

const INSTALLER_LOCK_DEFAULT = "/var/lib/kmt-legal/install.lock";
const INSTALLER_COMPLETED_SETTING = "installer.completed";

const officeProfileSchema = z.object({
  firmName: z.string().trim().min(2).max(120),
  publicPhone: z.string().trim().max(40).optional().or(z.literal("")),
  publicEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  primaryLocale: localeSchema
});

const firstAdminSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: z.string().min(10).max(256),
  locale: localeSchema
});

export const installerBootstrapSchema = z.object({
  office: officeProfileSchema,
  admin: firstAdminSchema
});

export type InstallerStatus = {
  enabled: boolean;
  locked: boolean;
  hasActiveSuperAdmin: boolean;
  canInstall: boolean;
  reason: string | null;
};

export function isInstallerEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.INSTALLER_ENABLED === "true";
}

export function getInstallerLockPath(env: NodeJS.ProcessEnv = process.env) {
  return env.INSTALLER_LOCK_PATH || INSTALLER_LOCK_DEFAULT;
}

export function installerTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-installer-token")?.trim() || new URL(request.url).searchParams.get("token")?.trim() || "";
}

export function assertInstallerToken(token: string, env: NodeJS.ProcessEnv = process.env) {
  const expected = env.INSTALLER_SETUP_TOKEN?.trim();
  if (!expected || !safeEqual(token, expected)) {
    throw new ApiError(403, "FORBIDDEN", "Installer setup token is invalid.");
  }
}

export async function getInstallerStatus(): Promise<InstallerStatus> {
  const enabled = isInstallerEnabled();
  const [locked, superAdminExists] = await Promise.all([hasInstallerLockFile(), hasActiveSuperAdmin()]);
  const reason = installerUnavailableReason({ enabled, locked, hasActiveSuperAdmin: superAdminExists });

  return {
    enabled,
    locked,
    hasActiveSuperAdmin: superAdminExists,
    canInstall: !reason,
    reason
  };
}

export async function getInstallerPreflight(token: string, input: { hostingMode?: HostingMode } = {}) {
  assertInstallerToken(token);
  const status = await getInstallerStatus();
  if (status.reason) {
    throw new ApiError(409, "CONFLICT", status.reason);
  }

  const checks = [
    check("installer_enabled", status.enabled, "INSTALLER_ENABLED=true"),
    check("installer_unlocked", !status.locked, "Installer lock file is absent."),
    check("first_admin_missing", !status.hasActiveSuperAdmin, "No active Super Admin exists yet."),
    check("database_url", Boolean(process.env.DATABASE_URL), "DATABASE_URL is configured."),
    check("uploads_dir", Boolean(process.env.UPLOADS_DIR), "UPLOADS_DIR is configured."),
    check("storage_driver", process.env.STORAGE_DRIVER === "vps-filesystem", "STORAGE_DRIVER=vps-filesystem"),
    check("staff_2fa_disabled", process.env.STAFF_2FA_MODE !== "totp", "STAFF_2FA_MODE is disabled."),
    check("smtp_disabled", process.env.SMTP_ENABLED !== "true", "SMTP is disabled for this release."),
    ...panelPreflightChecks(input.hostingMode ?? "terminal-vps")
  ];

  return {
    hostingMode: input.hostingMode ?? "terminal-vps",
    status,
    checks,
    ready: checks.every((item) => item.ok)
  };
}

export async function bootstrapFirstSuperAdmin(input: { token: string; body: unknown; request?: Request }) {
  assertInstallerToken(input.token);
  const status = await getInstallerStatus();
  if (status.reason) {
    throw new ApiError(409, "CONFLICT", status.reason);
  }

  const body = parseWithSchema(installerBootstrapSchema, input.body, "Installer bootstrap payload is invalid.");
  const role = await prisma.role.findUnique({
    where: { name: ROLES.superAdmin },
    select: { id: true, name: true }
  });

  if (!role) {
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "Super Admin role is missing. Run migrations and production seed first.");
  }

  const existing = await prisma.user.findUnique({
    where: { email: body.admin.email },
    select: { id: true }
  });
  if (existing) {
    throw new ApiError(409, "CONFLICT", "A user with this email already exists.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const activeSuperAdminCount = await tx.user.count({
      where: {
        status: "ACTIVE",
        role: { name: ROLES.superAdmin }
      }
    });
    if (activeSuperAdminCount > 0) {
      throw new ApiError(409, "CONFLICT", "Installer bootstrap is closed because an active Super Admin already exists.");
    }

    const user = await tx.user.create({
      data: {
        name: body.admin.name,
        email: body.admin.email,
        passwordHash: hashPassword(body.admin.password),
        roleId: role.id,
        status: "ACTIVE",
        locale: body.admin.locale
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } }
      }
    });

    await tx.systemSetting.upsert({
      where: { key: "office.profile" },
      create: {
        key: "office.profile",
        value: {
          firmName: body.office.firmName,
          publicPhone: body.office.publicPhone || "",
          publicEmail: body.office.publicEmail || "",
          primaryLocale: body.office.primaryLocale
        },
        updatedById: user.id
      },
      update: {
        value: {
          firmName: body.office.firmName,
          publicPhone: body.office.publicPhone || "",
          publicEmail: body.office.publicEmail || "",
          primaryLocale: body.office.primaryLocale
        },
        updatedById: user.id
      }
    });

    await tx.systemSetting.upsert({
      where: { key: "security.staff2fa" },
      create: {
        key: "security.staff2fa",
        value: {
          requiredForStaff: false,
          totpPrimary: false,
          emailOtpFallback: false,
          superAdminResetOnly: true
        },
        updatedById: user.id
      },
      update: {
        value: {
          requiredForStaff: false,
          totpPrimary: false,
          emailOtpFallback: false,
          superAdminResetOnly: true
        },
        updatedById: user.id
      }
    });

    return user;
  });

  await appendAuditLog({
    actorId: result.id,
    action: "installer.super_admin.bootstrap",
    resourceType: "User",
    resourceId: result.id,
    metadata: {
      role: result.role.name,
      staff2faMode: "disabled",
      smtp: "disabled"
    },
    request: input.request
  });

  return result;
}

export async function finishInstaller(input: { token: string; request?: Request }) {
  assertInstallerToken(input.token);
  const enabled = isInstallerEnabled();
  const locked = await hasInstallerLockFile();
  if (!enabled) {
    throw new ApiError(403, "FEATURE_DISABLED", "Installer is disabled.");
  }
  if (locked) {
    throw new ApiError(409, "CONFLICT", "Installer is already locked.");
  }

  const activeSuperAdmin = await prisma.user.findFirst({
    where: {
      status: "ACTIVE",
      role: { name: ROLES.superAdmin }
    },
    select: { id: true }
  });
  if (!activeSuperAdmin) {
    throw new ApiError(409, "CONFLICT", "Create the first Super Admin before closing the installer.");
  }

  await writeInstallerLock(activeSuperAdmin.id);
  await prisma.systemSetting.upsert({
    where: { key: INSTALLER_COMPLETED_SETTING },
    create: {
      key: INSTALLER_COMPLETED_SETTING,
      value: {
        completedAt: new Date().toISOString(),
        staff2faMode: "disabled",
        smtp: "disabled"
      },
      updatedById: activeSuperAdmin.id
    },
    update: {
      value: {
        completedAt: new Date().toISOString(),
        staff2faMode: "disabled",
        smtp: "disabled"
      },
      updatedById: activeSuperAdmin.id
    }
  });

  await appendAuditLog({
    actorId: activeSuperAdmin.id,
    action: "installer.locked",
    resourceType: "SystemSetting",
    resourceId: INSTALLER_COMPLETED_SETTING,
    metadata: { lockPath: getInstallerLockPath() },
    request: input.request
  });

  return { locked: true };
}

async function hasInstallerLockFile() {
  try {
    await fs.access(getInstallerLockPath());
    return true;
  } catch {
    return false;
  }
}

async function hasActiveSuperAdmin() {
  const count = await prisma.user.count({
    where: {
      status: "ACTIVE",
      role: { name: ROLES.superAdmin }
    }
  });
  return count > 0;
}

function installerUnavailableReason(status: { enabled: boolean; locked: boolean; hasActiveSuperAdmin: boolean }) {
  if (!status.enabled) {
    return "Installer is disabled.";
  }
  if (status.locked) {
    return "Installer is locked.";
  }
  if (status.hasActiveSuperAdmin) {
    return "An active Super Admin already exists.";
  }
  return null;
}

function check(id: string, ok: boolean, label: string) {
  return { id, ok, label };
}

async function writeInstallerLock(superAdminId: string) {
  const lockPath = getInstallerLockPath();
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  await fs.writeFile(
    lockPath,
    JSON.stringify(
      {
        lockedAt: new Date().toISOString(),
        superAdminId
      },
      null,
      2
    ),
    { flag: "wx", mode: 0o600 }
  );
}

function safeEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
