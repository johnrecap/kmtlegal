import path from "node:path";
import { paymentProvider, paymentProviderReadiness } from "@/server/payments/payment-config";

export type ProductionReadinessIssue = {
  code: string;
  severity: "error" | "warning";
  message: string;
};

const REQUIRED_UPLOAD_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png"
]);

export function productionReadinessIssues(env: NodeJS.ProcessEnv = process.env) {
  const issues: ProductionReadinessIssue[] = [];
  const isProduction = env.APP_ENV === "production" || env.NODE_ENV === "production";

  if (!isProduction) {
    return issues;
  }

  if (env.NODE_ENV !== "production") {
    issues.push({
      code: "NODE_ENV_NOT_PRODUCTION",
      severity: "error",
      message: "Production VPS must run a production build with NODE_ENV=production."
    });
  }

  if (!isHttpsOrigin(env.APP_ORIGIN)) {
    issues.push({
      code: "APP_ORIGIN_HTTPS_REQUIRED",
      severity: "error",
      message: "APP_ORIGIN must be the canonical HTTPS production origin."
    });
  }

  if (!env.AUTH_SECRET || env.AUTH_SECRET.includes("replace-with") || env.AUTH_SECRET.length < 32) {
    issues.push({
      code: "AUTH_SECRET_WEAK",
      severity: "error",
      message: "AUTH_SECRET must be a production-only secret with at least 32 characters."
    });
  }

  if (!isConfiguredPostgresUrl(env.DATABASE_URL)) {
    issues.push({
      code: "DATABASE_URL_REQUIRED",
      severity: "error",
      message: "DATABASE_URL must point to the production PostgreSQL database on the VPS and must not contain placeholder values."
    });
  }

  if (env.SESSION_COOKIE_SECURE !== "true") {
    issues.push({
      code: "SESSION_COOKIE_SECURE_REQUIRED",
      severity: "error",
      message: "SESSION_COOKIE_SECURE=true is required behind HTTPS on the VPS."
    });
  }

  if (env.CSRF_STRICT_ORIGIN === "false") {
    issues.push({
      code: "CSRF_STRICT_ORIGIN_DISABLED",
      severity: "error",
      message: "CSRF_STRICT_ORIGIN must be true or unset in production so API mutations reject missing Origin/Referer headers."
    });
  }

  if (env.STORAGE_DRIVER !== "vps-filesystem") {
    issues.push({
      code: "STORAGE_DRIVER_UNEXPECTED",
      severity: "error",
      message: "MVP production storage must use the private VPS filesystem driver."
    });
  }

  if (!isPrivateUploadRoot(env.UPLOADS_DIR)) {
    issues.push({
      code: "UPLOADS_DIR_PRIVATE_REQUIRED",
      severity: "error",
      message: "UPLOADS_DIR must be outside public web roots and served only through authorized app routes."
    });
  }

  if (Number(env.MAX_UPLOAD_MB) !== 5) {
    issues.push({
      code: "MAX_UPLOAD_MB_MISMATCH",
      severity: "error",
      message: "MAX_UPLOAD_MB must remain 5 for the MVP legal document contract."
    });
  }

  if (env.MALWARE_SCAN_MODE !== "required") {
    issues.push({
      code: "MALWARE_SCAN_REQUIRED",
      severity: "error",
      message: "MALWARE_SCAN_MODE=required is mandatory for production document uploads."
    });
  }

  const configuredTypes = new Set(
    (env.ALLOWED_UPLOAD_TYPES ?? "")
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean)
  );
  if (!sameSet(configuredTypes, REQUIRED_UPLOAD_TYPES)) {
    issues.push({
      code: "ALLOWED_UPLOAD_TYPES_MISMATCH",
      severity: "error",
      message: "ALLOWED_UPLOAD_TYPES must match the approved PDF/DOC/DOCX/JPG/PNG allowlist."
    });
  }

  if (env.SMTP_ENABLED === "true") {
    issues.push({
      code: "SMTP_ENABLED_UNSUPPORTED",
      severity: "error",
      message: "SMTP is documented as a future feature but must stay disabled in this release."
    });
  }

  if ((env.SMTP_USER && !env.SMTP_PASSWORD) || (!env.SMTP_USER && env.SMTP_PASSWORD)) {
    issues.push({
      code: "SMTP_CREDENTIAL_PAIR_REQUIRED",
      severity: "error",
      message: "SMTP_USER and SMTP_PASSWORD must be configured together if SMTP credentials are staged for a later release."
    });
  }

  if (env.KMT_DEMO_PASSWORD || env.KMT_DEMO_TOTP_SECRET) {
    issues.push({
      code: "DEMO_CREDENTIALS_FORBIDDEN",
      severity: "error",
      message: "Demo login shortcuts must not be enabled in production."
    });
  }

  if (env.STAFF_2FA_MODE === "totp") {
    issues.push({
      code: "STAFF_2FA_MODE_UNSUPPORTED",
      severity: "error",
      message: "TOTP is deferred and must not be enabled in this release. Use STAFF_2FA_MODE=disabled."
    });
  }

  if (env.INSTALLER_ENABLED === "true") {
    issues.push({
      code: "INSTALLER_ENABLED_IN_PRODUCTION",
      severity: "error",
      message: "The VPS installer must be disabled after the first Super Admin is created and the installer is locked."
    });
  }

  if (env.ENABLE_STITCH_CLONE === "true") {
    issues.push({
      code: "STITCH_CLONE_ENABLED_IN_PRODUCTION",
      severity: "error",
      message: "Stitch clone reference routes must be disabled in production."
    });
  }

  if (env.AI_PROVIDER && env.AI_PROVIDER !== "mock" && !env.AI_API_KEY) {
    issues.push({
      code: "AI_API_KEY_REQUIRED",
      severity: "error",
      message: "Non-mock AI providers require AI_API_KEY to stay server-side only."
    });
  }

  if (env.AI_PROVIDER && env.AI_PROVIDER !== "mock" && env.AI_PROVIDER !== "openrouter" && (!env.AI_BASE_URL || !env.AI_MODEL)) {
    issues.push({
      code: "AI_PROVIDER_CONFIG_INCOMPLETE",
      severity: "error",
      message: "Custom non-mock AI providers require AI_BASE_URL and AI_MODEL."
    });
  }

  try {
    const provider = paymentProvider(env);
    const readiness = paymentProviderReadiness(provider, env);
    if (provider !== "paymob") {
      issues.push({
        code: "PAYMENT_PROVIDER_PAYMOB_REQUIRED",
        severity: "error",
        message: "PAYMENT_PROVIDER must remain paymob for this release."
      });
    }
    if (!readiness.configured) {
      issues.push({
        code: "PAYMENT_PROVIDER_CONFIG_STAGED_INCOMPLETE",
        severity: "warning",
        message: `Payment provider ${readiness.provider} is staged but missing server-side configuration; paid booking must remain disabled.`
      });
    }
  } catch {
    issues.push({
      code: "PAYMENT_PROVIDER_UNSUPPORTED",
      severity: "error",
      message: "PAYMENT_PROVIDER must be paytabs or paymob."
    });
  }

  if (env.PAYTABS_ENABLED === "true") {
    issues.push({
      code: "PAYTABS_ENABLED_UNSUPPORTED",
      severity: "error",
      message: "PayTabs must remain disabled as a standby provider in this release."
    });
  }

  if (!env.PAYMENT_RECEIPT_SIGNING_SECRET) {
    issues.push({
      code: "PAYMENT_RECEIPT_SIGNING_SECRET_RECOMMENDED",
      severity: "warning",
      message: "PAYMENT_RECEIPT_SIGNING_SECRET is recommended for signed public receipt links; AUTH_SECRET is used as a fallback."
    });
  }

  if (!env.PAYMENT_STATUS_SIGNING_SECRET && !env.PAYMENT_RECEIPT_SIGNING_SECRET) {
    issues.push({
      code: "PAYMENT_STATUS_SIGNING_SECRET_RECOMMENDED",
      severity: "warning",
      message: "PAYMENT_STATUS_SIGNING_SECRET is recommended for signed payment return/status links; receipt signing secret or AUTH_SECRET is used as a fallback."
    });
  }

  if (env.ANALYTICS_ENABLED === "false") {
    issues.push({
      code: "ANALYTICS_DISABLED",
      severity: "warning",
      message: "Privacy-safe analytics is disabled; production observability coverage will be reduced."
    });
  }

  if (env.SENTRY_ENABLED === "true" && (!env.SENTRY_DSN || !env.SENTRY_AUTH_TOKEN || !env.SENTRY_ORG || !env.SENTRY_PROJECT)) {
    issues.push({
      code: "SENTRY_CONFIG_INCOMPLETE",
      severity: "error",
      message: "Enabled Sentry monitoring requires SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT."
    });
  }

  if (env.SENTRY_ENABLED === "true" && env.NEXT_PUBLIC_SENTRY_ENABLED !== "true") {
    issues.push({
      code: "SENTRY_CLIENT_FLAG_MISMATCH",
      severity: "warning",
      message: "Server Sentry is enabled while client Sentry remains disabled."
    });
  }

  return issues;
}

export function assertProductionReady(env: NodeJS.ProcessEnv = process.env) {
  const issues = productionReadinessIssues(env).filter((issue) => issue.severity === "error");
  if (issues.length > 0) {
    throw new Error(`Production readiness failed: ${issues.map((issue) => issue.code).join(", ")}`);
  }
}

function isHttpsOrigin(value?: string) {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isConfiguredPostgresUrl(value?: string) {
  if (!value || value.includes("CHANGE_ME")) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return Boolean(parsed.hostname && parsed.pathname.length > 1 && parsed.username) && (parsed.protocol === "postgresql:" || parsed.protocol === "postgres:");
  } catch {
    return false;
  }
}

function isPrivateUploadRoot(value?: string) {
  if (!value) {
    return false;
  }

  const resolved = path.resolve(value).toLowerCase();
  const publicSegment = `${path.sep}public`;
  const staticSegments = [`${path.sep}.next`, `${path.sep}public_html`, `${path.sep}www`, `${path.sep}htdocs`];

  return (
    !resolved.endsWith(publicSegment) &&
    !resolved.includes(`${publicSegment}${path.sep}`) &&
    !staticSegments.some((segment) => resolved.endsWith(segment) || resolved.includes(`${segment}${path.sep}`))
  );
}

function sameSet(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) {
    return false;
  }
  return [...left].every((value) => right.has(value));
}
