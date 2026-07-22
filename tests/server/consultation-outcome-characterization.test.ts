import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  consultationOutcomeReasonLabel,
  consultationOutcomeSourceLabel,
  localizeApiMessage,
  plan36ConsultationOutcomeCopy
} from "@/lib/ui-copy";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("PLAN-36 connected-surface characterization", () => {
  it("moves the synthetic review queue onto the canonical pending outcome", () => {
    const notificationService = source("src/server/admin/notification-service.ts");

    expect(notificationService).toContain('consultationOutcomeViewWhere("current"');
  });

  it("wires shareable outcome views and counts into the consultation list", () => {
    const reviewService = source("src/server/admin/consultation-review-service.ts");
    const listPage = source("src/app/(app-ar)/admin/consultations/page.tsx");
    const uiCopy = source("src/lib/ui-copy.ts");

    expect(reviewService).toContain("viewCounts");
    expect(reviewService).toContain("consultationOutcomeViewWhere");
    expect(listPage).toContain("CONSULTATION_OUTCOME_VIEWS.map");
    expect(uiCopy).toContain('awaiting_result: "بانتظار النتيجة"');
    expect(uiCopy).toContain('missed: "الفائتة"');
  });

  it("uses canonical outcome scopes in dashboard, calendar, and notifications", () => {
    expect(source("src/server/admin/dashboard-service.ts")).toContain("consultations.awaiting_result");
    expect(source("src/server/admin/dashboard-service.ts")).toContain("consultations.missed");
    expect(source("src/server/admin/calendar-service.ts")).toContain("effectiveConsultationOutcome");
    expect(source("src/server/admin/notification-service.ts")).toContain("syncConsultationOutcomeNotifications");
  });

  it("removes obsolete roadmap ids from runtime admin UI only", () => {
    const runtimeFiles = [
      "src/app/(app-ar)/admin/cases/page.tsx",
      "src/app/(app-ar)/admin/cases/[caseId]/page.tsx",
      "src/app/(app-ar)/admin/clients/[clientId]/page.tsx"
    ];

    for (const file of runtimeFiles) {
      expect(source(file)).not.toMatch(/PLAN-(17|19)/);
    }
  });

  it("keeps validation and unknown categorized reasons in safe Arabic UI copy", () => {
    expect(localizeApiMessage("Consultation outcome payload is invalid.", "ar"))
      .toBe("بيانات نتيجة الاستشارة غير مكتملة أو غير صحيحة.");
    expect(localizeApiMessage("Consultation reopen payload is invalid.", "ar"))
      .toBe("بيانات إعادة فتح الاستشارة غير مكتملة أو غير صحيحة.");
    expect(consultationOutcomeReasonLabel("INTERNAL_REASON_FROM_A_NEWER_RELEASE"))
      .toBe(plan36ConsultationOutcomeCopy.unknownReason);
    expect(consultationOutcomeSourceLabel("INTERNAL_SOURCE_FROM_A_NEWER_RELEASE"))
      .toBe(plan36ConsultationOutcomeCopy.unknownSource);
    expect(consultationOutcomeSourceLabel("WORKER")).toBe("عامل الصيانة");
    expect(source("src/app/(app-ar)/admin/consultations/page.tsx")).not.toContain("?? reasonCode");
    expect(source("src/app/(app-ar)/admin/consultations/[consultationId]/page.tsx")).not.toContain("?? reasonCode");
    expect(source("src/server/audit/audit-event-catalog.ts")).toContain("consultationOutcomeSourceLabel");
  });

  it("orders deployment safely and verifies both PM2 processes beyond one cycle", () => {
    const deploy = source("deploy/install/aapanel-pm2-update.sh");
    const backup = deploy.lastIndexOf("create_verified_database_backup");
    const migration = deploy.lastIndexOf("npm run db:migrate");
    const reconciliation = deploy.lastIndexOf("run_payment_maintenance_once");
    const appRestart = deploy.lastIndexOf('pm2 start "${NEXT_BIN}"');

    expect(backup).toBeGreaterThan(-1);
    expect(backup).toBeLessThan(migration);
    expect(migration).toBeLessThan(reconciliation);
    expect(reconciliation).toBeLessThan(appRestart);
    expect(deploy).toContain("PAYMENT_MAINTENANCE_STABILITY_SECONDS <= PAYMENT_MAINTENANCE_INTERVAL_SECONDS");
    expect(deploy).toContain("APP_BASELINE_RESTARTS");
    expect(deploy).toContain("verify_application_stability_after_maintenance_cycle");
    expect(deploy.lastIndexOf("restart_payment_maintenance_pm2"))
      .toBeLessThan(deploy.lastIndexOf("verify_application_stability_after_maintenance_cycle"));
  });
});
