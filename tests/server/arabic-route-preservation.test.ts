import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deriveArabicPublicRoutes, missingArabicRoutes } from "../../scripts/lib/public-route-inventory.mjs";

const source = readFileSync("src/features/public-site/public-pages.tsx", "utf8");
// Phase 06 — Articles HIDE PUBLIC, Case Studies HIDE PUBLIC, Media DELETE:
// the AR dispatcher no longer accepts these sections (they 404).
const baseline = ["/ar", "/ar/services", "/ar/services/[slug]", "/ar/team", "/ar/team/[slug]", "/ar/contact", "/ar/book-consultation", "/ar/privacy", "/ar/terms"];

describe("Arabic dispatcher preservation", () => {
  it("keeps every accepted route reachable through the actual dispatcher", async () => {
    const actual = await deriveArabicPublicRoutes(source);
    expect(missingArabicRoutes(baseline.map(pattern => ({ pattern })), actual)).toEqual([]);
    expect(actual.find(route => route.pattern === "/ar/services/[slug]")?.view).toBe("ServiceDetailPageView");
  });

  it("detects removal of a routing branch from an in-memory sample", async () => {
    const branch = '  if (section === "privacy" && path.length === 1) return <PrivacyPageView locale={locale} />;';
    expect(source).toContain(branch);
    const sample = source.replace(branch, "");
    expect(missingArabicRoutes(await deriveArabicPublicRoutes(source), await deriveArabicPublicRoutes(sample))).toEqual(["/ar/privacy"]);
  });
});
