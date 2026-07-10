import { describe, expect, it } from "vitest";
import { scrubSentryEvent } from "@/lib/sentry-privacy";

describe("Sentry event privacy", () => {
  it("removes user identity, request bodies, headers, cookies, and query strings", () => {
    const scrubbed = scrubSentryEvent({
      user: { id: "client-1", email: "client@example.com" },
      request: {
        url: "https://example.test/client/cases?token=secret",
        data: { document: "private" },
        headers: { authorization: "Bearer secret" },
        cookies: { session: "secret" }
      },
      extra: {
        phone: "+201000000000",
        safeCount: 2,
        note: "Reach client@example.com or +20 100 000 0000",
        returnUrl: "https://example.test/payment/return?token=receipt-secret"
      },
      exception: { values: [{ type: "Error", value: "Failed for client@example.com" }] }
    });

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request).toEqual({ url: "https://example.test/client/cases" });
    expect(scrubbed.extra).toEqual({
      phone: "[REDACTED]",
      safeCount: 2,
      note: "Reach [REDACTED_EMAIL] or [REDACTED_PHONE]",
      returnUrl: "https://example.test/payment/return"
    });
    expect(scrubbed.exception).toEqual({ values: [{ type: "Error", value: "Failed for [REDACTED_EMAIL]" }] });
  });
});
