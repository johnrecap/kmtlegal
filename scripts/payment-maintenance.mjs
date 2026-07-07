import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

loadEnvFiles([".env", ".env.local"]);

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getDatabaseUrl(),
    max: boundedNumber(process.env.PRISMA_POOL_MAX, 1, 20, 1)
  })
});
const args = new Set(process.argv.slice(2));
const watch = args.has("--watch");
const intervalSeconds = boundedNumber(process.env.PAYMENT_MAINTENANCE_INTERVAL_SECONDS, 60, 3600, 300);

async function main() {
  if (watch) {
    await runOnce();
    const timer = setInterval(() => {
      runOnce().catch((error) => {
        console.error("[payment-maintenance] failed", error);
      });
    }, intervalSeconds * 1000);
    timer.unref?.();
    await new Promise(() => undefined);
    return;
  }

  await runOnce();
}

async function runOnce() {
  const now = new Date();
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
}

async function expireOpenPaymentAttempts(now) {
  const attempts = await prisma.paymentAttempt.findMany({
    where: {
      status: { in: ["CREATED", "PENDING"] },
      expiresAt: { lt: now }
    },
    select: { id: true, appointmentId: true, consultationRequestId: true }
  });

  if (!attempts.length) {
    return 0;
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

  return attempts.length;
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

main()
  .catch((error) => {
    console.error("[payment-maintenance] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!watch) {
      await prisma.$disconnect();
    }
  });
