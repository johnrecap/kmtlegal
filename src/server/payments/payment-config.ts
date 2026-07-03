import { ApiError } from "@/server/http/errors";

export const DEFAULT_PAYMENT_PROVIDER = "paytabs";

export function paymentProvider(env: NodeJS.ProcessEnv = process.env) {
  return (env.PAYMENT_PROVIDER || DEFAULT_PAYMENT_PROVIDER).trim().toLowerCase();
}

export function paymentReservationMinutes(env: NodeJS.ProcessEnv = process.env) {
  const configured = Number.parseInt(env.PAYMENT_ATTEMPT_EXPIRY_MINUTES ?? "", 10);
  if (Number.isFinite(configured) && configured >= 5 && configured <= 60) {
    return configured;
  }
  return 15;
}

export function paymentWebhookSecret(env: NodeJS.ProcessEnv = process.env) {
  return env.PAYMENT_WEBHOOK_SECRET || env.PAYTABS_WEBHOOK_SECRET || "";
}

export function requireVerifiedWebhookSignature(env: NodeJS.ProcessEnv = process.env) {
  return env.APP_ENV === "production" || env.NODE_ENV === "production" || env.PAYMENT_REQUIRE_WEBHOOK_SIGNATURE === "true";
}

export function publicAppUrl(request?: Request, env: NodeJS.ProcessEnv = process.env) {
  const configured = env.APP_URL || env.NEXT_PUBLIC_APP_URL || env.PUBLIC_APP_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (request) {
    const url = new URL(request.url);
    return url.origin;
  }

  return "http://localhost:3000";
}

export function paymentReturnUrl(attemptId: string, request?: Request) {
  return `${publicAppUrl(request)}/payment/consultation/return?attemptId=${encodeURIComponent(attemptId)}`;
}

export function paymentFailureUrl(attemptId: string, request?: Request) {
  return `${publicAppUrl(request)}/payment/consultation/return?attemptId=${encodeURIComponent(attemptId)}&status=failed`;
}

export function assertLiveProviderConfigured(env: NodeJS.ProcessEnv = process.env) {
  if (env.PAYMENT_HOSTED_CHECKOUT_URL_TEMPLATE) {
    return;
  }

  if (env.APP_ENV === "production" || env.NODE_ENV === "production") {
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "Payment provider is not configured for production checkout.");
  }
}
