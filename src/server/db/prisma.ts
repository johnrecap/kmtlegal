import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const LOCAL_DATABASE_URL = "postgresql://kmt_legal:kmt_legal_dev_password@localhost:5432/kmt_legal";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getDatabaseUrl(),
      max: getPrismaPoolMax()
    }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });
}

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  if (env.APP_ENV === "production" || env.NODE_ENV === "production") {
    if (isNextBuildPhase(env) && env.ALLOW_BUILD_WITHOUT_DATABASE_URL === "true") {
      return LOCAL_DATABASE_URL;
    }

    throw new Error("DATABASE_URL is required in production.");
  }

  return LOCAL_DATABASE_URL;
}

function isNextBuildPhase(env: NodeJS.ProcessEnv) {
  return env.NEXT_PHASE === "phase-production-build" || env.npm_lifecycle_event === "build";
}

function getPrismaPoolMax(env: NodeJS.ProcessEnv = process.env) {
  const configured = Number.parseInt(env.PRISMA_POOL_MAX ?? "", 10);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }

  if (env.APP_ENV === "local" || env.NODE_ENV === "development") {
    return 1;
  }

  return 10;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
