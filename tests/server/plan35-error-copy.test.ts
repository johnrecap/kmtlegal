import { describe, expect, it } from "vitest";
import { localizeApiMessage, plan35ApiErrorCopy, plan35ApiErrorSourceMessages } from "@/lib/ui-copy";
import { canonicalApiErrorMessage, jsonError, type ApiErrorCode } from "@/server/http/errors";

const cases = Object.entries(plan35ApiErrorSourceMessages) as Array<[ApiErrorCode, string]>;

describe("PLAN-35 stable API errors and Arabic recovery copy", () => {
  it.each(cases)("keeps %s machine-readable and user-safe", async (code, source) => {
    const expected = plan35ApiErrorCopy[code as keyof typeof plan35ApiErrorCopy].message;
    expect(canonicalApiErrorMessage(code, "Prisma exception with raw SQL")).toBe(source);
    expect(localizeApiMessage(source)).toBe(expected);

    const response = jsonError(409, code, "Prisma exception with raw SQL", `request-${code.toLowerCase()}`);
    const body = await response.json();
    expect(body.error).toEqual({ code, message: expected, details: [], requestId: `request-${code.toLowerCase()}` });
    expect(body.error.message).not.toMatch(/prisma|sql|exception/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("keeps case-reference recovery explicit and preserves entered values", () => {
    expect(plan35ApiErrorCopy.CASE_REFERENCE_CONFLICT.preservesEnteredValues).toBe(true);
    expect(plan35ApiErrorCopy.CASE_REFERENCE_CONFLICT.message).toContain("احتفظنا بالبيانات");
    expect(plan35ApiErrorCopy.CASE_REFERENCE_CONFLICT.recoveryAction).toContain("محاولة جديدة");
  });
});
