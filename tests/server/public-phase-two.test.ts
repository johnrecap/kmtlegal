import { afterEach, describe, expect, it, vi } from "vitest";
import { bookingCategoryForPublicService, getPublicContent, findPublicService } from "@/content/public-content";
import { publicAnalyticsContext } from "@/lib/public-analytics";
import { parseClientAnalyticsEvent } from "@/server/observability/analytics-service";
import { publicSiteOrigin } from "@/lib/public-site-origin";
import robots from "@/app/robots";

afterEach(() => vi.unstubAllEnvs());
describe("phase two service, telemetry and indexing contracts", () => {
  it("keeps six bilingual public areas on four established booking categories", () => {
    const expected = ["legal-consultation", "company-formation", "corporate-business-services", "contracts", "real-estate-legal-support", "claims-collections"];
    for (const locale of ["ar", "en"] as const) {
      const services = getPublicContent(locale).legalServices;
      expect(services.map(s => s.slug)).toEqual(expected);
      expect(new Set(services.map(s => s.category)).size).toBe(4);
      for (const service of services) {
        expect(bookingCategoryForPublicService(service.slug, locale)).toBe(service.category);
        expect(bookingCategoryForPublicService(service.title, locale === "ar" ? "en" : "ar")).toBe(service.category);
        expect(service.audience.length).toBeGreaterThan(0);
        expect(service.steps.length).toBe(3);
      }
    }
    expect(bookingCategoryForPublicService("Companies & Commercial Contracts", "ar")).toBe("corporate-business-services");
    expect(bookingCategoryForPublicService("الشركات والعقود التجارية", "en")).toBe("corporate-business-services");
    expect(findPublicService("ar", "contract-drafting")?.slug).toBe("contracts");
    expect(bookingCategoryForPublicService("unknown", "en")).toBe("");
  });
  it("emits safe route categories rather than sensitive URLs or unknown identifiers", () => {
    expect(publicAnalyticsContext("/ar/services/company-formation")).toEqual({ page: "service", service: "company-formation", locale: "ar" });
    expect(publicAnalyticsContext("/ar/articles/some-public-title")).toEqual({ page: "article", locale: "ar" });
    for (const path of ["/client", "/admin/reports", "/ar/payment/consultation/return", "/client-account/setup", "/services/unknown"]) expect(publicAnalyticsContext(path)).toBeNull();
  });
  it("rejects private values, arbitrary slugs and extra fields before accepting client events", () => {
    const valid = { name: "public.contact_clicked", properties: { page: "contact", locale: "ar", channel: "whatsapp", placement: "footer" } };
    expect(parseClientAnalyticsEvent(valid).properties).toEqual(valid.properties);
    for (const extra of [{ email: "someone@example.invalid" }, { url: "/contact?token=secret" }, { service: "private-case-reference" }, { message: "Private legal facts" }]) {
      expect(() => parseClientAnalyticsEvent({ ...valid, properties: { ...valid.properties, ...extra } })).toThrow();
    }
    expect(() => parseClientAnalyticsEvent({ name: "consultation.submitted", properties: {} })).toThrow();
  });
  it("uses the canonical production origin by default and excludes private crawling", () => {
    vi.stubEnv("APP_ORIGIN", "");
    expect(publicSiteOrigin()).toBe("https://kmtlegal.org");
    expect(robots().sitemap).toBe("https://kmtlegal.org/sitemap.xml");
    expect(JSON.stringify(robots().rules)).toContain("/admin");
  });
});
