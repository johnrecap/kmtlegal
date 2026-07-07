import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPackage from "@prisma/client";

const PrismaClient = prismaClientPackage.PrismaClient ?? prismaClientPackage.default?.PrismaClient;
if (typeof PrismaClient !== "function") {
  throw new Error("PrismaClient export is unavailable. Run prisma generate before starting payment maintenance.");
}

loadEnvFiles([".env.production.local", ".env.local", ".env"]);

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getDatabaseUrl(),
    max: boundedNumber(process.env.PRISMA_POOL_MAX, 1, 20, 1)
  })
});
const args = new Set(process.argv.slice(2));
const watch = args.has("--watch");
const intervalSeconds = boundedNumber(process.env.PAYMENT_MAINTENANCE_INTERVAL_SECONDS, 60, 3600, 300);
const paymentMaintenanceBatchSize = boundedNumber(process.env.PAYMENT_MAINTENANCE_BATCH_SIZE, 1, 500, 100);
const paymentMaintenanceMaxBatches = boundedNumber(process.env.PAYMENT_MAINTENANCE_MAX_BATCHES, 1, 20, 10);
let runInProgress = false;

async function main() {
  if (watch) {
    await runOnce();
    const timer = setInterval(() => {
      runOnce().catch((error) => {
        reportFailure(error).catch((alertError) => {
          console.error("[payment-maintenance] alert failed", safeErrorSummary(alertError));
        });
      });
    }, intervalSeconds * 1000);
    process.once("SIGTERM", () => shutdown(timer));
    process.once("SIGINT", () => shutdown(timer));
    await new Promise(() => undefined);
    return;
  }

  await runOnce();
}

async function runOnce() {
  if (runInProgress) {
    const now = new Date();
    console.log(
      JSON.stringify({
        ok: true,
        skipped: true,
        reason: "already_running",
        ranAt: now.toISOString()
      })
    );
    return;
  }

  runInProgress = true;
  const now = new Date();
  try {
    const expiredAttempts = await expireOpenPaymentAttempts(now);
    const cleanup = await cleanupOldOperationalData(now);
    console.log(
      JSON.stringify({
        ok: true,
        expiredAttempts,
        cleanup,
        ranAt: now.toISOString()
      })
    );
  } finally {
    runInProgress = false;
  }
}

async function shutdown(timer) {
  clearInterval(timer);
  await prisma.$disconnect();
  process.exit(0);
}

async function expireOpenPaymentAttempts(now) {
  let expiredCount = 0;

  for (let batch = 0; batch < paymentMaintenanceMaxBatches; batch += 1) {
    const attempts = await prisma.paymentAttempt.findMany({
      where: {
        status: { in: ["CREATED", "PENDING"] },
        expiresAt: { lt: now }
      },
      select: { id: true, appointmentId: true, consultationRequestId: true },
      orderBy: { expiresAt: "asc" },
      take: paymentMaintenanceBatchSize
    });

    if (!attempts.length) {
      break;
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.updateMany({
        where: { id: { in: attempts.map((attempt) => attempt.id) } },
        data: { status: "EXPIRED", failureCode: "ATTEMPT_EXPIRED" }
      });

      await tx.appointment.updateMany({
        where: { id: { in: attempts.map((attempt) => attempt.appointmentId) }, status: "RESERVED" },
        data: { status: "CANCELLED", notes: "Payment reservation expired before trusted payment confirmation." }
      });

      await tx.consultationRequest.updateMany({
        where: { id: { in: attempts.map((attempt) => attempt.consultationRequestId) }, status: "PAYMENT_PENDING" },
        data: { status: "REVIEWING" }
      });
    });

    expiredCount += attempts.length;

    if (attempts.length < paymentMaintenanceBatchSize) {
      break;
    }
  }

  return expiredCount;
}

async function cleanupOldOperationalData(now) {
  const sessionRetentionDays = boundedNumber(process.env.SESSION_CLEANUP_RETENTION_DAYS, 1, 365, 30);
  const analyticsRetentionDays = boundedNumber(process.env.ANALYTICS_RETENTION_DAYS, 30, 1095, 180);
  const webhookRetentionDays = boundedNumber(process.env.PAYMENT_WEBHOOK_RETENTION_DAYS, 30, 1095, 180);

  const expiredSessionCutoff = daysAgo(now, sessionRetentionDays);
  const analyticsCutoff = daysAgo(now, analyticsRetentionDays);
  const webhookCutoff = daysAgo(now, webhookRetentionDays);

  const [sessions, analyticsEvents, webhookEvents] = await prisma.$transaction([
    prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: expiredSessionCutoff } },
          { revokedAt: { lt: expiredSessionCutoff } }
        ]
      }
    }),
    prisma.analyticsEvent.deleteMany({
      where: { createdAt: { lt: analyticsCutoff } }
    }),
    prisma.paymentWebhookEvent.deleteMany({
      where: {
        receivedAt: { lt: webhookCutoff },
        processingStatus: { in: ["PROCESSED", "IGNORED"] }
      }
    })
  ]);

  return {
    sessions: sessions.count,
    analyticsEvents: analyticsEvents.count,
    webhookEvents: webhookEvents.count
  };
}

function daysAgo(now, days) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
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
    throw new Error("DATABASE_URL is required for payment maintenance in production.");
  }

  return "postgresql://kmt_legal:kmt_legal_dev_password@localhost:5432/kmt_legal";
}

async function reportFailure(error) {
  console.error("[payment-maintenance] failed", safeErrorSummary(error));
  await notifyMaintenanceFailure(error);
}

async function notifyMaintenanceFailure(error) {
  const webhookUrl = process.env.PAYMENT_MAINTENANCE_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service: "kmtlegal-payment-maintenance",
      ok: false,
      ranAt: new Date().toISOString(),
      error: safeErrorSummary(error)
    })
  });

  if (!response.ok) {
    throw new Error(`alert webhook returned ${response.status}`);
  }
}

function safeErrorSummary(error) {
  if (!error || typeof error !== "object") {
    return { name: "Error", message: "Unknown payment maintenance failure." };
  }

  return {
    name: String(error.name || "Error").slice(0, 80),
    code: error.code ? String(error.code).slice(0, 80) : undefined,
    message: String(error.message || "Payment maintenance failed.").slice(0, 500)
  };
}

main()
  .catch(async (error) => {
    await reportFailure(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!watch) {
      await prisma.$disconnect();
    }
  });
