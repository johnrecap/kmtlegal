import { describe, expect, it } from "vitest";
import {
  LEGAL_TIME_ZONE,
  addCairoDateInputDays,
  cairoLocalDateTimeToIso,
  consultationServiceCategoryLabel,
  formatCairoDateInput,
  formatDateTime
} from "@/lib/legal-format";

describe("legal date formatting", () => {
  it("pins shared server and client formatting to Africa/Cairo", () => {
    const value = new Date("2026-01-15T10:00:00.000Z");
    const expected = new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Cairo"
    }).format(value);

    expect(LEGAL_TIME_ZONE).toBe("Africa/Cairo");
    expect(formatDateTime(value)).toBe(expected);
  });

  it("derives date-input and midnight boundaries from Cairo rather than UTC", () => {
    expect(formatCairoDateInput("2026-07-21T21:30:00.000Z")).toBe("2026-07-22");
    expect(cairoLocalDateTimeToIso("2026-07-22T00:00")).toBe("2026-07-21T21:00:00.000Z");
    expect(addCairoDateInputDays("2026-07-22", 30)).toBe("2026-08-21");
  });

  it("rejects impossible Cairo calendar inputs", () => {
    expect(cairoLocalDateTimeToIso("2026-02-30T10:00")).toBeNull();
    expect(addCairoDateInputDays("2026-02-30", 1)).toBeNull();
  });

  it("never exposes an unknown consultation category slug", () => {
    expect(consultationServiceCategoryLabel("legal-consultation")).toBe("استشارات حسب المجال");
    expect(consultationServiceCategoryLabel("INTERNAL_CATEGORY_FROM_A_NEWER_RELEASE"))
      .toBe("مجال استشارة آخر");
  });
});
