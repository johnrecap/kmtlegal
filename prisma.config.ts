import { defineConfig } from "prisma/config";

const LOCAL_DATABASE_URL = "postgresql://kmt_legal:kmt_legal_dev_password@localhost:5432/kmt_legal";
const databaseUrl = process.env.DATABASE_URL ?? localDatabaseUrl();

function localDatabaseUrl() {
  if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
    if (isNextBuildPhase() && process.env.ALLOW_BUILD_WITHOUT_DATABASE_URL === "true") {
      return LOCAL_DATABASE_URL;
    }

    throw new Error("DATABASE_URL is required in production.");
  }

  return LOCAL_DATABASE_URL;
}

function isNextBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl
  },
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs"
  }
});
