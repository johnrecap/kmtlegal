import { ApiError } from "@/server/http/errors";

export const SUPPORTED_PAYMENT_PROVIDERS = ["paytabs", "paymob"] as const;
export type PaymentProviderName = (typeof SUPPORTED_PAYMENT_PROVIDERS)[number];

export const DEFAULT_PAYMENT_PROVIDER: PaymentProviderName = "paytabs";

export function paymentProvider(env: NodeJS.ProcessEnv = process.env) {
  return normalizePaymentProvider(env.PAYMENT_PROVIDER);
}

export function normalizePaymentProvider(value?: string | null): PaymentProviderName {
  const provider = (value || DEFAULT_PAYMENT_PROVIDER).trim().toLowerCase();
  if (isSupportedPaymentProvider(provider)) {
    return provider;
  }

  throw new ApiError(400, "VALIDATION_ERROR", "Payment provider is not supported.", [
    { path: "activeProvider", message: "Supported payment providers are paytabs and paymob.", code: "unsupported_provider" }
  ]);
}

export function isSupportedPaymentProvider(value: string): value is PaymentProviderName {
  return (SUPPORTED_PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

export function paymentReservationMinutes(env: NodeJS.ProcessEnv = process.env) {
  const configured = Number.parseInt(env.PAYMENT_ATTEMPT_EXPIRY_MINUTES ?? "", 10);
  if (Number.isFinite(configured) && configured >= 5 && configured <= 60) {
    return configured;
  }
  return 15;
}

export function paymentWebhookSecret(provider: PaymentProviderName = paymentProvider(), env: NodeJS.ProcessEnv = process.env) {
  if (provider === "paymob") {
    return env.PAYMOB_HMAC_SECRET || env.PAYMENT_WEBHOOK_SECRET || "";
  }

  return env.PAYTABS_WEBHOOK_SECRET || env.PAYMENT_WEBHOOK_SECRET || "";
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

export type PaymentReturnUrlOptions = {
  token?: string | null;
  locale?: "ar" | "en" | null;
  status?: string | null;
};

export function paymentReturnUrl(attemptId: string, request?: Request, options: PaymentReturnUrlOptions = {}) {
  const url = new URL(`${publicAppUrl(request)}/payment/consultation/return`);
  url.searchParams.set("attemptId", attemptId);
  if (options.token) {
    url.searchParams.set("token", options.token);
  }
  if (options.locale) {
    url.searchParams.set("locale", options.locale);
  }
  if (options.status) {
    url.searchParams.set("status", options.status);
  }
  return url.toString();
}

export function paymentFailureUrl(attemptId: string, request?: Request, options: Omit<PaymentReturnUrlOptions, "status"> = {}) {
  return paymentReturnUrl(attemptId, request, { ...options, status: "failed" });
}

export function paymentWebhookUrl(provider: PaymentProviderName, request?: Request) {
  return `${publicAppUrl(request)}/api/webhooks/${provider}`;
}

export function paytabsHostedCheckoutTemplate(env: NodeJS.ProcessEnv = process.env) {
  return env.PAYTABS_HOSTED_CHECKOUT_URL_TEMPLATE || env.PAYMENT_HOSTED_CHECKOUT_URL_TEMPLATE || "";
}

export function paymobApiBaseUrl(env: NodeJS.ProcessEnv = process.env) {
  return (env.PAYMOB_API_BASE_URL || "https://accept.paymob.com").replace(/\/$/, "");
}

export function paymobCheckoutBaseUrl(env: NodeJS.ProcessEnv = process.env) {
  return env.PAYMOB_CHECKOUT_BASE_URL || "https://accept.paymob.com/unifiedcheckout/";
}

export function paymobPaymentMethodIds(env: NodeJS.ProcessEnv = process.env) {
  return (env.PAYMOB_PAYMENT_METHOD_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (/^\d+$/.test(value) ? Number(value) : value));
}

export function paymentProviderReadiness(provider: PaymentProviderName, env: NodeJS.ProcessEnv = process.env) {
  if (provider === "paymob") {
    const required: Array<[string, string | undefined]> = [
      ["PAYMOB_SECRET_KEY", env.PAYMOB_SECRET_KEY],
      ["PAYMOB_PUBLIC_KEY", env.PAYMOB_PUBLIC_KEY],
      ["PAYMOB_HMAC_SECRET", env.PAYMOB_HMAC_SECRET],
      ["PAYMOB_PAYMENT_METHOD_IDS", env.PAYMOB_PAYMENT_METHOD_IDS]
    ];
    const missing = required
      .filter(([, value]) => !value || String(value).includes("CHANGE_ME"))
      .map(([key]) => key);

    return {
      provider,
      configured: missing.length === 0,
      missing,
      checkoutMode: "paymob-unified-checkout"
    };
  }

  const missing = paytabsHostedCheckoutTemplate(env).includes("CHANGE_ME") || !paytabsHostedCheckoutTemplate(env)
    ? ["PAYTABS_HOSTED_CHECKOUT_URL_TEMPLATE"]
    : [];

  return {
    provider,
    configured: missing.length === 0,
    missing,
    checkoutMode: "hosted-checkout-url-template"
  };
}

export function assertProviderReadyForActivation(provider: PaymentProviderName, env: NodeJS.ProcessEnv = process.env) {
  const readiness = paymentProviderReadiness(provider, env);
  if (readiness.configured) {
    return;
  }

  throw new ApiError(409, "CONFLICT", "Payment provider is not configured.", readiness.missing.map((key) => ({
    path: key,
    message: `${key} is required before activating ${provider}.`,
    code: "missing_payment_provider_config"
  })));
}

export function assertLiveProviderConfigured(provider: PaymentProviderName = paymentProvider(), env: NodeJS.ProcessEnv = process.env) {
  const readiness = paymentProviderReadiness(provider, env);
  if (readiness.configured) {
    return;
  }

  if (env.APP_ENV === "production" || env.NODE_ENV === "production") {
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "Payment provider is not configured for production checkout.");
  }
}
