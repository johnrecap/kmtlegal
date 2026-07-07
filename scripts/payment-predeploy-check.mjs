import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPackage from "@prisma/client";

const PrismaClient = prismaClientPackage.PrismaClient ?? prismaClientPackage.default?.PrismaClient;
if (typeof PrismaClient !== "function") {
  throw new Error("PrismaClient export is unavailable. Run prisma generate before starting payment predeploy checks.");
}

loadEnvFiles([".env.production.local", ".env.local", ".env"]);

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getDatabaseUrl(),
    max: boundedNumber(process.env.PRISMA_POOL_MAX, 1, 20, 1)
  })
});

async function main() {
  const duplicateManualReceipts = await findDuplicateManualPaidReceipts();

  const result = {
    ok: duplicateManualReceipts.length === 0,
    duplicateManualPaidReceiptNumbers: duplicateManualReceipts,
    ranAt: new Date().toISOString()
  };

  console.log(JSON.stringify(result));

  if (!result.ok) {
    process.exitCode = 1;
  }
}

async function findDuplicateManualPaidReceipts() {
  return prisma.$queryRaw`
    SELECT
      lower(btrim("receiptNumber")) AS "receiptNumber",
      COUNT(*)::int AS "count"
    FROM "payments"
    WHERE "status" = 'PAID'
      AND "paymentAttemptId" IS NULL
      AND "receiptNumber" IS NOT NULL
      AND btrim("receiptNumber") <> ''
    GROUP BY lower(btrim("receiptNumber"))
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, lower(btrim("receiptNumber")) ASC
    LIMIT 50
  `;
}

function boundedNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isFinite(parsed) && parsed >= min && parsed <= max) {
    return parsed;
  }
  return fallback;
}

function loadEnvFiles(files) {
  for (const file of files) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) {
      continue;
    }

    const lines = readFileSync(path, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...rest] = trimmed.split("=");
      if (!key || process.env[key] !== undefined) {
        continue;
      }
      process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required for payment predeploy checks in production.");
  }

  return "postgresql://kmt_legal:kmt_legal_dev_password@localhost:5432/kmt_legal";
}

main()
  .catch((error) => {
    console.error("[payment-predeploy-check] failed", safeErrorSummary(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

function safeErrorSummary(error) {
  if (!error || typeof error !== "object") {
    return { name: "Error", message: "Unknown payment predeploy check failure." };
  }

  return {
    name: String(error.name || "Error").slice(0, 80),
    code: error.code ? String(error.code).slice(0, 80) : undefined,
    message: String(error.message || "Payment predeploy check failed.").slice(0, 500)
  };
}
