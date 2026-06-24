import { promises as fs } from "node:fs";
import type { PrismaClient } from "@prisma/client";
import { ROLES } from "@/server/auth/policy";
import { productionReadinessIssues } from "@/server/config/production-readiness";
import { getInstallerLockPath, isInstallerEnabled } from "@/server/install/installer-env";

export type RuntimeReadinessCheck = {
  id: string;
  ok: boolean;
  blocking: boolean;
  label: string;
  message: string;
};

export type RuntimeReadinessReport = {
  ready: boolean;
  checkedAt: string;
  checks: RuntimeReadinessCheck[];
};

type RuntimeReadinessPrismaClient = Pick<PrismaClient, "$queryRaw" | "role" | "user" | "systemSetting">;

type DatabaseReadinessOptions = {
  requireBootstrap: boolean;
  prismaClient?: RuntimeReadinessPrismaClient;
};

export function isProductionRuntime(env: NodeJS.ProcessEnv = process.env) {
  return env.APP_ENV === "production" || env.NODE_ENV === "production";
}

export function readinessSummary(checks: RuntimeReadinessCheck[]): RuntimeReadinessReport {
  return {
    ready: checks.every((readinessCheck) => readinessCheck.ok || !readinessCheck.blocking),
    checkedAt: new Date().toISOString(),
    checks
  };
}

export async function getApplicationReadiness(env: NodeJS.ProcessEnv = process.env) {
  if (!isProductionRuntime(env)) {
    return readinessSummary([
      passingCheck("runtime.mode", "Runtime mode", "Readiness gate is enforced only in production runtime.")
    ]);
  }

  const environmentChecks = productionReadinessIssues(env).map((issue) => ({
    id: `env.${issue.code}`,
    ok: false,
    blocking: issue.severity === "error",
    label: issue.code,
    message: issue.message
  }));

  const databaseChecks = await databaseReadinessChecks({ requireBootstrap: true });
  return readinessSummary([...environmentChecks, ...databaseChecks]);
}

export async function databaseReadinessChecks(options: DatabaseReadinessOptions) {
  const prismaClient = options.prismaClient ?? (await loadPrismaClient().catch(() => null));
  const checks: RuntimeReadinessCheck[] = [];

  if (!prismaClient) {
    return [
      blockingCheck("database.connection", "Database connection", "Prisma could not initialize. Check DATABASE_URL and server environment."),
      blockingCheck("database.schema", "Database schema", "Migrations cannot be verified until Prisma initializes."),
      blockingCheck("database.seed", "Production seed", "Role seed cannot be verified until Prisma initializes."),
      ...(options.requireBootstrap
        ? [
            blockingCheck("installer.bootstrap", "First Super Admin", "First Super Admin cannot be verified until Prisma initializes."),
            blockingCheck("installer.lock", "Installer lock", "Installer completion cannot be verified until Prisma initializes.")
          ]
        : [])
    ];
  }

  try {
    await prismaClient.$queryRaw`SELECT 1`;
    checks.push(passingCheck("database.connection", "Database connection", "PostgreSQL accepted a basic query."));
  } catch {
    return [
      blockingCheck("database.connection", "Database connection", "PostgreSQL is not reachable from the app process."),
      blockingCheck("database.schema", "Database schema", "Migrations cannot be verified until the database connects."),
      blockingCheck("database.seed", "Production seed", "Role seed cannot be verified until the database connects."),
      ...(options.requireBootstrap
        ? [
            blockingCheck("installer.bootstrap", "First Super Admin", "First Super Admin cannot be verified until the database connects."),
            blockingCheck("installer.lock", "Installer lock", "Installer completion cannot be verified until the database connects.")
          ]
        : [])
    ];
  }

  const seedChecks = await seedReadinessChecks(prismaClient);
  checks.push(...seedChecks);

  if (options.requireBootstrap) {
    checks.push(...(await bootstrapReadinessChecks(prismaClient)));
  }

  return checks;
}

async function loadPrismaClient(): Promise<RuntimeReadinessPrismaClient> {
  const { prisma } = await import("@/server/db/prisma");
  return prisma;
}

export async function installerDatabasePreflightChecks() {
  return databaseReadinessChecks({ requireBootstrap: false });
}

async function seedReadinessChecks(prismaClient: RuntimeReadinessPrismaClient) {
  try {
    const superAdminRole = await prismaClient.role.findUnique({
      where: { name: ROLES.superAdmin },
      select: { id: true }
    });

    return [
      passingCheck("database.schema", "Database schema", "Required Prisma tables are queryable."),
      superAdminRole
        ? passingCheck("database.seed", "Production seed", "Required roles are present.")
        : blockingCheck("database.seed", "Production seed", "Required roles are missing. Run migrations and production seed.")
    ];
  } catch {
    return [
      blockingCheck("database.schema", "Database schema", "Required Prisma tables are missing or not queryable."),
      blockingCheck("database.seed", "Production seed", "Required roles cannot be verified before migrations run.")
    ];
  }
}

async function bootstrapReadinessChecks(prismaClient: RuntimeReadinessPrismaClient) {
  const checks: RuntimeReadinessCheck[] = [];

  try {
    const activeSuperAdminCount = await prismaClient.user.count({
      where: {
        status: "ACTIVE",
        role: { name: ROLES.superAdmin }
      }
    });

    checks.push(
      activeSuperAdminCount > 0
        ? passingCheck("installer.bootstrap", "First Super Admin", "At least one active Super Admin exists.")
        : blockingCheck("installer.bootstrap", "First Super Admin", "Create the first active Super Admin before opening the app.")
    );
  } catch {
    checks.push(blockingCheck("installer.bootstrap", "First Super Admin", "First Super Admin status cannot be verified."));
  }

  checks.push(await installerCompletionCheck(prismaClient));
  return checks;
}

async function installerCompletionCheck(prismaClient: RuntimeReadinessPrismaClient) {
  try {
    const [completionSetting, lockFileExists] = await Promise.all([
      prismaClient.systemSetting.findUnique({
        where: { key: "installer.completed" },
        select: { id: true }
      }),
      hasInstallerLockFile()
    ]);

    if (!completionSetting || !lockFileExists || isInstallerEnabled()) {
      return blockingCheck("installer.lock", "Installer lock", "Lock the installer and disable INSTALLER_ENABLED before opening the app.");
    }

    return passingCheck("installer.lock", "Installer lock", "Installer is completed, locked, and disabled.");
  } catch {
    return blockingCheck("installer.lock", "Installer lock", "Installer completion cannot be verified.");
  }
}

async function hasInstallerLockFile() {
  try {
    await fs.access(getInstallerLockPath());
    return true;
  } catch {
    return false;
  }
}

function passingCheck(id: string, label: string, message: string): RuntimeReadinessCheck {
  return { id, ok: true, blocking: false, label, message };
}

function blockingCheck(id: string, label: string, message: string): RuntimeReadinessCheck {
  return { id, ok: false, blocking: true, label, message };
}
