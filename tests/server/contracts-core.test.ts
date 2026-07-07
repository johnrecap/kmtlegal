import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError, jsonError, RateLimitApiError } from "@/server/http/errors";
import { toPagination } from "@/server/http/pagination";
import { MemoryRateLimiter, enforceRateLimit } from "@/server/rate-limit/memory-rate-limit";
import { redactMetadata } from "@/server/audit/redaction";
import { parseWithSchema } from "@/server/validation/schemas";
import { localizeApiMessage, roleDisplayLabel, sourceTypeDisplayLabel, technicalValueDisplayLabel } from "@/lib/ui-copy";

describe("server contract foundation", () => {
  it("returns the shared error response shape with requestId and details", async () => {
    const response = jsonError(400, "VALIDATION_ERROR", "Invalid request.", "req_test", [
      { path: "email", message: "Invalid email", code: "invalid_string" }
    ]);

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "الطلب غير صحيح.",
        details: [{ path: "email", message: "Invalid email", code: "invalid_string" }],
        requestId: "req_test"
      }
    });
  });

  it("maps schema failures to ApiError details", () => {
    expect(() => parseWithSchema(z.object({ email: z.string().email() }), { email: "bad" })).toThrow(ApiError);

    try {
      parseWithSchema(z.object({ email: z.string().email() }), { email: "bad" });
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe("VALIDATION_ERROR");
      expect((error as ApiError).details?.[0]?.path).toBe("email");
    }
  });

  it("normalizes pagination limits", () => {
    expect(toPagination({ page: -1, pageSize: 500 })).toEqual({ page: 1, pageSize: 100, skip: 0, take: 100 });
    expect(toPagination({ page: 3, pageSize: 25 })).toEqual({ page: 3, pageSize: 25, skip: 50, take: 25 });
  });

  it("redacts sensitive audit metadata recursively", () => {
    const redacted = redactMetadata({
      actorId: "user-1",
      password: "secret",
      nested: {
        apiKey: "key",
        prompt: "raw legal prompt",
        safe: "ok"
      }
    });

    expect(redacted).toEqual({
      actorId: "user-1",
      password: "[REDACTED]",
      nested: {
        apiKey: "[REDACTED]",
        prompt: "[REDACTED]",
        safe: "ok"
      }
    });
  });

  it("enforces rate limit buckets", () => {
    const limiter = new MemoryRateLimiter({ windowMs: 60_000, max: 1 });
    expect(enforceRateLimit(limiter, "user-1").allowed).toBe(true);
    expect(() => enforceRateLimit(limiter, "user-1")).toThrow(RateLimitApiError);
  });

  it("prunes expired rate limit buckets", () => {
    const limiter = new MemoryRateLimiter({ windowMs: 1_000, max: 2 });
    expect(limiter.check("user-1", 0).allowed).toBe(true);
    expect(limiter.size()).toBe(1);

    expect(limiter.check("user-2", 1_001).allowed).toBe(true);
    expect(limiter.size()).toBe(1);
  });

  it("localizes user-facing API and product labels while preserving technical values", () => {
    expect(localizeApiMessage("Authentication required.")).toBe("يجب تسجيل الدخول للمتابعة.");
    expect(localizeApiMessage("Payment payload is invalid.")).toBe("الفاتورة غير مكتملة أو غير صحيحة.");
    expect(localizeApiMessage("Article was not found.")).toBe("لم يتم العثور على المقال.");
    expect(localizeApiMessage("Only Super Admin can change user passwords.")).toBe("تغيير كلمات مرور المستخدمين متاح لمدير النظام فقط.");
    expect(roleDisplayLabel("Super Admin")).toBe("مدير النظام");
    expect(roleDisplayLabel("Office Admin")).toBe("مدير المكتب");
    expect(sourceTypeDisplayLabel("manual")).toBe("يدوي");
    expect(technicalValueDisplayLabel("read-only")).toBe("للقراءة فقط");
  });
});
