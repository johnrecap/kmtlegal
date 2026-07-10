import { describe, expect, it } from "vitest";
import { formatPublicDate, groupSlotsByDay } from "@/features/public-site/booking-chat-formatters";
import { editHref, exportHref, flattenSearchParams, operationsPageHref } from "@/features/admin/finance/finance-page-helpers";
import { addCairoDays, cairoDateString, cairoWeekday } from "@/server/consultations/consultation-date-utils";
import { safeWebhookPayloadSnapshot } from "@/server/payments/payment-webhook-safety";

describe("PLAN-34 decomposition characterization", () => {
  it("preserves Cairo date and grouped slot behavior", () => {
    expect(cairoDateString(new Date("2026-07-08T21:30:00.000Z"))).toBe("2026-07-09");
    expect(addCairoDays("2026-07-09", 2)).toBe("2026-07-11");
    expect(cairoWeekday("2026-07-11")).toBe(6);

    const groups = groupSlotsByDay(
      [
        { id: "one", startsAt: "2026-07-09T08:00:00.000Z" },
        { id: "two", startsAt: "2026-07-09T10:00:00.000Z" }
      ],
      "en"
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.slots.map((slot) => slot.id)).toEqual(["one", "two"]);
    expect(formatPublicDate("invalid-date", "en")).toBe("invalid-date");
  });

  it("preserves finance query links and webhook redaction", () => {
    const query = flattenSearchParams({ status: ["PAID", "PENDING"], page: "2" });
    expect(query).toEqual({ status: "PAID", page: "2" });
    expect(editHref("payment-1", query)).toContain("editPaymentId=payment-1");
    expect(operationsPageHref(query, "attemptPage", 3)).toContain("attemptPage=3");
    expect(exportHref({ ...query, editPaymentId: "payment-1" })).not.toContain("editPaymentId");
    expect(safeWebhookPayloadSnapshot({ checkoutUrl: "https://pay.test?token=secret", status: "paid" })).toEqual({
      checkoutUrl: "[REDACTED]",
      status: "paid"
    });
  });
});
