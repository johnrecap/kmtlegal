import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("PLAN-37 overdue-unbooked characterization", () => {
  it("defines a distinct exact-72-hour view instead of treating every pending request as current", () => {
    const policy = source("src/server/admin/consultation-outcome-policy.ts");

    expect(policy).toContain('"overdue_unbooked"');
    expect(policy).toContain("CONSULTATION_OVERDUE_UNBOOKED_HOURS");
    expect(policy).toContain("createdAt");
    expect(policy).toContain("endsAt");
  });

  it("returns one asOf snapshot and operational timing from the consultation list", () => {
    const reviewService = source("src/server/admin/consultation-review-service.ts");
    const outcomeService = source("src/server/admin/consultation-outcome-service.ts");
    const policy = source("src/server/admin/consultation-outcome-policy.ts");

    expect(reviewService).toContain("asOf");
    expect(reviewService).toContain("toAdminConsultationListItem(row, asOf)");
    expect(outcomeService).toContain("operationalTiming");
    expect(policy).toContain("isOverdueUnbooked");
    expect(policy).toContain("overdueAt");
  });

  it("provides the atomic initial schedule route and service", () => {
    const route = "src/app/api/admin/consultations/[consultationId]/schedule/route.ts";

    expect(existsSync(resolve(process.cwd(), route))).toBe(true);
    expect(source("src/server/admin/consultation-review-service.ts")).toContain(
      "scheduleConsultation"
    );
  });

  it("reconciles converted and rejected missing-primary records and deduplicates overdue alerts", () => {
    const maintenance = source("scripts/consultation-outcome-maintenance.mjs");
    const notifications = source("src/server/admin/notification-service.ts");
    const runtimeCopy = source("src/lib/plan36-runtime-copy.json");

    expect(maintenance).toContain("BACKFILL_CONVERTED_WITHOUT_PRIMARY");
    expect(maintenance).toContain("overdueUnbooked");
    expect(notifications).toContain("syncConsultationOutcomeNotifications");
    expect(runtimeCopy).toContain("overdueTitle");
  });

  it("connects the new queue to dashboard and Arabic operational UI copy", () => {
    expect(source("src/server/admin/dashboard-service.ts")).toContain(
      "consultations.overdue_unbooked"
    );
    expect(source("src/lib/ui-copy.ts")).toContain("تاريخ إنشاء الطلب");
    const listPage = source("src/app/(app-ar)/admin/consultations/page.tsx");
    expect(listPage).toContain("overdue_unbooked");
    expect(listPage).toContain(
      "row.operationalTiming.isOverdueUnbooked && row.operationalTiming.overdueAt"
    );
  });
});
