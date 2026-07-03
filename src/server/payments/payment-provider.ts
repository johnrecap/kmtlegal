import { createHmac, timingSafeEqual } from "crypto";
import { assertLiveProviderConfigured, paymentFailureUrl, paymentProvider, paymentReturnUrl } from "./payment-config";

export type HostedCheckoutInput = {
  attemptId: string;
  amount: string;
  currency: string;
  description: string;
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  request?: Request;
};

export type HostedCheckoutResult = {
  provider: string;
  checkoutUrl: string;
  providerSessionId: string;
};

export async function createHostedCheckout(input: HostedCheckoutInput): Promise<HostedCheckoutResult> {
  const provider = paymentProvider();
  assertLiveProviderConfigured();

  const templatedUrl = process.env.PAYMENT_HOSTED_CHECKOUT_URL_TEMPLATE;
  if (templatedUrl) {
    return {
      provider,
      checkoutUrl: renderCheckoutTemplate(templatedUrl, input),
      providerSessionId: input.attemptId
    };
  }

  return {
    provider,
    checkoutUrl: paymentReturnUrl(input.attemptId, input.request),
    providerSessionId: input.attemptId
  };
}

export function verifyWebhookSignature(input: { rawBody: string; signature: string | null; secret: string }) {
  if (!input.secret || !input.signature) {
    return false;
  }

  const expected = createHmac("sha256", input.secret).update(input.rawBody).digest("hex");
  return timingSafeHexEqual(normalizeSignature(input.signature), expected);
}

function renderCheckoutTemplate(template: string, input: HostedCheckoutInput) {
  const replacements: Record<string, string> = {
    attemptId: input.attemptId,
    amount: input.amount,
    currency: input.currency,
    returnUrl: paymentReturnUrl(input.attemptId, input.request),
    failureUrl: paymentFailureUrl(input.attemptId, input.request)
  };

  return template.replace(/\{(attemptId|amount|currency|returnUrl|failureUrl)\}/g, (_, key: string) =>
    encodeURIComponent(replacements[key] ?? "")
  );
}

function normalizeSignature(value: string) {
  return value.trim().replace(/^sha256=/i, "");
}

function timingSafeHexEqual(left: string, right: string) {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) {
    return false;
  }
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}
