import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { productionReadinessIssues } from "@/server/config/production-readiness";
import { getDatabaseUrl } from "@/server/db/prisma";
import { getIpAddress } from "@/server/auth/session-store";
import { redactMetadata } from "@/server/audit/redaction";
import { evaluateMutationOrigin } from "@/server/security/origin-guard";

describe("security, privacy, upload, and observability hardening", () => {
  it("publishes global browser security headers", async () => {
    const require = createRequire(path.resolve(process.cwd(), "tests/server/security-hardening.test.ts"));
    const { contentSecurityPolicy, securityHeaders } = require("../../security-headers.cjs") as {
      contentSecurityPolicy: () => string;
      securityHeaders: () => Array<{ key: string; value: string }>;
    };

    const headers = new Map(securityHeaders().map((header) => [header.key, header.value]));
    const csp = contentSecurityPolicy();

    expect(headers.get("Content-Security-Policy")).toBe(csp);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("allows Cloudflare analytics endpoints in production CSP", () => {
    const require = createRequire(path.resolve(process.cwd(), "tests/server/security-hardening.test.ts"));
    const { contentSecurityPolicy } = require("../../security-headers.cjs") as {
      contentSecurityPolicy: () => string;
    };
    const previousNodeEnv = process.env.NODE_ENV;

    try {
      Reflect.set(process.env, "NODE_ENV", "production");
      const productionCsp = contentSecurityPolicy();

      expect(productionCsp).toContain("script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com");
      expect(productionCsp).toContain("connect-src 'self' https://cloudflareinsights.com");
      expect(productionCsp).toContain("upgrade-insecure-requests");
    } finally {
      if (previousNodeEnv) {
        Reflect.set(process.env, "NODE_ENV", previousNodeEnv);
      } else {
        Reflect.deleteProperty(process.env, "NODE_ENV");
      }
    }
  });

  it("rejects cross-origin state-changing API requests", () => {
    expect(
      evaluateMutationOrigin({
        method: "GET",
        requestUrl: "https://kmt.example/api/auth/me",
        appOrigin: "https://kmt.example"
      }).allowed
    ).toBe(true);

    expect(
      evaluateMutationOrigin({
        method: "POST",
        requestUrl: "https://kmt.example/api/admin/clients",
        originHeader: "https://kmt.example",
        appOrigin: "https://kmt.example",
        strictMissingOrigin: true
      })
    ).toMatchObject({ allowed: true, reason: "same_origin" });

    expect(
      evaluateMutationOrigin({
        method: "POST",
        requestUrl: "https://kmt.example/api/admin/clients",
        originHeader: "https://evil.example",
        appOrigin: "https://kmt.example",
        strictMissingOrigin: true
      })
    ).toMatchObject({ allowed: false, reason: "cross_origin" });

    expect(
      evaluateMutationOrigin({
        method: "POST",
        requestUrl: "https://kmt.example/api/admin/clients",
        appOrigin: "https://kmt.example",
        strictMissingOrigin: true
      })
    ).toMatchObject({ allowed: false, reason: "missing_origin_rejected" });

    expect(
      evaluateMutationOrigin({
        method: "POST",
        requestUrl: "https://kmt.example/api/admin/clients",
        originHeader: "https://kmt.example",
        strictMissingOrigin: true
      })
    ).toMatchObject({ allowed: false, reason: "missing_app_origin" });

    expect(
      evaluateMutationOrigin({
        method: "POST",
        requestUrl: "http://127.0.0.1:3000/api/auth/logout",
        originHeader: "http://127.0.0.1:3000",
        appOrigin: "http://localhost:3000",
        strictMissingOrigin: false
      })
    ).toMatchObject({ allowed: true, reason: "same_origin" });

    expect(
      evaluateMutationOrigin({
        method: "POST",
        requestUrl: "http://127.0.0.1:3000/api/auth/logout",
        originHeader: "http://127.0.0.1:3000",
        appOrigin: "http://localhost:3000",
        strictMissingOrigin: true
      })
    ).toMatchObject({ allowed: false, reason: "cross_origin" });
  });

  it("redacts secrets, emails, phone numbers, and sensitive keys from logs", () => {
    const redacted = redactMetadata({
      safe: "status-only",
      actorEmail: "lawyer@example.com",
      freeText: "Contact client@example.com or +20 100 555 7788",
      nested: {
        message: "private intake message",
        token: "secret-token"
      }
    }) as Record<string, unknown>;

    expect(redacted.safe).toBe("status-only");
    expect(redacted.actorEmail).toBe("[REDACTED]");
    expect(redacted.freeText).toBe("Contact [REDACTED_EMAIL] or [REDACTED_PHONE]");
    expect(redacted.nested).toEqual({
      message: "[REDACTED]",
      token: "[REDACTED]"
    });
  });

  it("flags production environment misconfiguration before VPS release", () => {
    const badIssues = productionReadinessIssues({
      APP_ENV: "production",
      NODE_ENV: "development",
      APP_ORIGIN: "http://kmt.example",
      AUTH_SECRET: "replace-with-local-dev-secret",
      SESSION_COOKIE_SECURE: "false",
      CSRF_STRICT_ORIGIN: "false",
      STORAGE_DRIVER: "vps-filesystem",
      UPLOADS_DIR: "/srv/app/public/uploads",
      MAX_UPLOAD_MB: "25",
      ALLOWED_UPLOAD_TYPES: "application/pdf",
      KMT_DEMO_PASSWORD: "demo",
      STAFF_2FA_MODE: "totp",
      INSTALLER_ENABLED: "true"
    });

    expect(badIssues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "NODE_ENV_NOT_PRODUCTION",
        "APP_ORIGIN_HTTPS_REQUIRED",
        "AUTH_SECRET_WEAK",
        "DATABASE_URL_REQUIRED",
        "SESSION_COOKIE_SECURE_REQUIRED",
        "CSRF_STRICT_ORIGIN_DISABLED",
        "UPLOADS_DIR_PRIVATE_REQUIRED",
        "MAX_UPLOAD_MB_MISMATCH",
        "ALLOWED_UPLOAD_TYPES_MISMATCH",
        "DEMO_CREDENTIALS_FORBIDDEN",
        "STAFF_2FA_MODE_UNSUPPORTED",
        "INSTALLER_ENABLED_IN_PRODUCTION"
      ])
    );

    expect(
      productionReadinessIssues({
        APP_ENV: "production",
        NODE_ENV: "production",
        APP_ORIGIN: "https://kmt.example",
        AUTH_SECRET: "0123456789abcdef0123456789abcdef",
        DATABASE_URL: "postgresql://kmt_prod:secret@127.0.0.1:5432/kmt_prod",
        SESSION_COOKIE_SECURE: "true",
        CSRF_STRICT_ORIGIN: "true",
        STORAGE_DRIVER: "vps-filesystem",
        UPLOADS_DIR: "/var/lib/kmt-legal/uploads",
        MAX_UPLOAD_MB: "5",
        ALLOWED_UPLOAD_TYPES:
          "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png",
        SMTP_ENABLED: "true",
        STAFF_2FA_MODE: "disabled",
        INSTALLER_ENABLED: "false",
        AI_PROVIDER: "mock",
        ANALYTICS_ENABLED: "true"
      }).map((issue) => issue.code)
    ).toContain("SMTP_ENABLED_UNSUPPORTED");

    const okIssues = productionReadinessIssues({
      APP_ENV: "production",
      NODE_ENV: "production",
      APP_ORIGIN: "https://kmt.example",
      AUTH_SECRET: "0123456789abcdef0123456789abcdef",
      DATABASE_URL: "postgresql://kmt_prod:secret@127.0.0.1:5432/kmt_prod",
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
      PAYTABS_HOSTED_CHECKOUT_URL_TEMPLATE: "https://payments.example/checkout/{attemptId}",
      PAYMENT_RECEIPT_SIGNING_SECRET: "0123456789abcdef0123456789abcdef",
      ANALYTICS_ENABLED: "true"
    });

    expect(okIssues).toEqual([]);
  });

  it("uses X-Real-IP in production and ignores client-controlled X-Forwarded-For", () => {
    const previousAppEnv = process.env.APP_ENV;
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.APP_ENV = "production";
    Reflect.set(process.env, "NODE_ENV", "production");

    try {
      const request = new Request("https://kmt.example/api/auth/login", {
        headers: {
          "x-forwarded-for": "203.0.113.250, 10.0.0.10",
          "x-real-ip": "10.0.0.10"
        }
      });

      expect(getIpAddress(request)).toBe("10.0.0.10");
      expect(getIpAddress(new Request("https://kmt.example", { headers: { "x-forwarded-for": "203.0.113.250" } }))).toBeNull();
    } finally {
      process.env.APP_ENV = previousAppEnv;
      if (previousNodeEnv) {
        Reflect.set(process.env, "NODE_ENV", previousNodeEnv);
      } else {
        Reflect.deleteProperty(process.env, "NODE_ENV");
      }
    }
  });

  it("keeps sensitive auth routes and 2FA reset contract hardened", () => {
    const authMeSource = fs.readFileSync(path.join(process.cwd(), "src/app/api/auth/me/route.ts"), "utf8");
    const reset2faSource = fs.readFileSync(path.join(process.cwd(), "src/app/api/admin/users/[userId]/2fa/reset/route.ts"), "utf8");
    const middlewareSource = fs.readFileSync(path.join(process.cwd(), "src/middleware.ts"), "utf8");
    const nextConfigSource = fs.readFileSync(path.join(process.cwd(), "next.config.mjs"), "utf8");

    expect(authMeSource).toContain('"Cache-Control": "no-store"');
    expect(reset2faSource).toContain("FEATURE_DISABLED");
    expect(middlewareSource).toContain('response.headers.set("Cache-Control", "no-store")');
    expect(nextConfigSource).toContain('source: "/admin/:path*"');
    expect(nextConfigSource).toContain('source: "/client/:path*"');
    expect(nextConfigSource).toContain('source: "/portal/:path*"');
    expect(nextConfigSource).toContain('source: "/login/:path*"');
    expect(nextConfigSource).toContain('source: "/install/:path*"');
  });

  it("keeps admin finance export and webhook replay behind authenticated finance services", () => {
    const financeExportSource = fs.readFileSync(path.join(process.cwd(), "src/app/api/admin/finance/export/route.ts"), "utf8");
    const webhookReplaySource = fs.readFileSync(path.join(process.cwd(), "src/app/api/admin/payments/webhooks/[eventId]/replay/route.ts"), "utf8");
    const financeServiceSource = fs.readFileSync(path.join(process.cwd(), "src/server/admin/finance-report-service.ts"), "utf8");
    const paymentServiceSource = fs.readFileSync(path.join(process.cwd(), "src/server/payments/payment-service.ts"), "utf8");

    expect(financeExportSource).toContain("getAuthContextFromRequest");
    expect(financeExportSource).toContain("exportAdminPaymentsCsv");
    expect(webhookReplaySource).toContain("getAuthContextFromRequest");
    expect(webhookReplaySource).toContain("replayAdminPaymentWebhookEvent");
    expect(financeServiceSource).toContain("assertFinanceRead(input.actor)");
    expect(paymentServiceSource).toContain("canManageAdminPaymentOperations(input.actor)");
  });

  it("keeps payment maintenance failures observable without sending stack traces", () => {
    const maintenanceSource = fs.readFileSync(path.join(process.cwd(), "scripts/payment-maintenance.mjs"), "utf8");

    expect(maintenanceSource).toContain("PAYMENT_MAINTENANCE_ALERT_WEBHOOK_URL");
    expect(maintenanceSource).toContain('import prismaClientPackage from "@prisma/client"');
    expect(maintenanceSource).not.toContain('import { PrismaClient } from "@prisma/client"');
    expect(maintenanceSource).toContain('process.once("SIGTERM"');
    expect(maintenanceSource).not.toContain("timer.unref");
    expect(maintenanceSource).toContain("safeErrorSummary");
    expect(maintenanceSource).toContain("message: String(error.message");
    expect(maintenanceSource).not.toContain("error.stack");
  });

  it("does not fall back to a dev database URL at production runtime", () => {
    expect(() => getDatabaseUrl({ APP_ENV: "production", NODE_ENV: "production" })).toThrow("DATABASE_URL");
    expect(() => getDatabaseUrl({ APP_ENV: "production", NODE_ENV: "production", npm_lifecycle_event: "build" })).toThrow("DATABASE_URL");
    expect(
      getDatabaseUrl({
        APP_ENV: "production",
        NODE_ENV: "production",
        npm_lifecycle_event: "build",
        ALLOW_BUILD_WITHOUT_DATABASE_URL: "true"
      })
    ).toContain("localhost");
  });
});
