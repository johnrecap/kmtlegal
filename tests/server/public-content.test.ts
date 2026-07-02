import { describe, expect, it } from "vitest";
import {
  articles,
  caseStudies,
  findPublicService,
  getPublicContent,
  legalServices,
  lawyers,
  navForPath,
  practiceAreaMatrix,
  publicFooterContent,
  publicIndustries,
  publicSearchText,
  representativeMatters
} from "@/content/public-content";

describe("public content contracts", () => {
  it("provides public routes with stable slugs", () => {
    expect(legalServices.map((service) => service.slug)).toEqual([
      "legal-consultation",
      "corporate-business-services",
      "real-estate-legal-support",
      "claims-collections"
    ]);
    expect(lawyers.map((lawyer) => lawyer.slug)).toContain("maryam-khaled");
    expect(articles.map((article) => article.slug)).toContain("contract-risk-basics");
    expect(caseStudies.map((study) => study.slug)).toContain("anonymous-commercial-dispute");
  });

  it("marks active navigation without duplicating destinations", () => {
    const nav = navForPath("/services/legal-consultation");
    const servicesItem = nav.find((item) => item.href === "/services");
    expect(servicesItem?.label).toBe("Services");
    expect(servicesItem?.active).toBe(true);
    expect(new Set(nav.map((item) => item.href)).size).toBe(nav.length);
  });

  it("keeps English primary content and Arabic optional content on the same slugs", () => {
    const english = getPublicContent("en");
    const arabic = getPublicContent("ar");

    expect(english.navItems[0].label).toBe("Home");
    expect(arabic.navItems[0].label).toBe("الرئيسية");
    expect(english.legalServices.map((service) => service.slug)).toEqual(arabic.legalServices.map((service) => service.slug));
    expect(english.legalServices.map((service) => service.subServices.length)).toEqual(arabic.legalServices.map((service) => service.subServices.length));
    expect(english.caseStudies.map((study) => study.slug)).toEqual(arabic.caseStudies.map((study) => study.slug));
  });

  it("covers the dark luxury practice-area matrix with stable service links", () => {
    expect(practiceAreaMatrix.map((area) => area.key)).toEqual([
      "legal-consultation",
      "corporate-business-services",
      "real-estate-legal-support",
      "claims-collections"
    ]);
    expect(practiceAreaMatrix.map((area) => area.href)).toContain("/services/corporate-business-services");
    expect(new Set(legalServices.map((service) => service.slug)).size).toBe(legalServices.length);
  });

  it("keeps old service links available as aliases without showing old services publicly", () => {
    expect(legalServices.map((service) => service.slug)).not.toContain("contract-drafting");
    expect(legalServices.map((service) => service.slug)).not.toContain("corporate-law");
    expect(findPublicService("en", "contract-drafting")?.slug).toBe("corporate-business-services");
    expect(findPublicService("en", "debt-recovery")?.slug).toBe("claims-collections");
  });

  it("keeps public content free of obvious private document or case identifiers", () => {
    const serialized = publicSearchText({
      legalServices,
      lawyers,
      articles,
      caseStudies,
      representativeMatters,
      publicIndustries,
      publicFooterContent
    });
    expect(serialized).not.toMatch(/KMT-\d{4}-\d+/i);
    expect(serialized).not.toContain("filekey");
    expect(serialized).not.toContain("password");
  });

  it("requires public case studies to carry disclaimers", () => {
    expect(caseStudies.every((study) => study.disclaimer.includes("not") || study.disclaimer.includes("anonymous"))).toBe(true);
  });

  it("keeps representative and footer content privacy-safe", () => {
    expect(representativeMatters.every((matter) => matter.privacyNote.toLowerCase().includes("anonymized") || matter.privacyNote.includes("No party"))).toBe(true);
    expect(publicFooterContent.practiceLinks.map((link) => link.href)).toContain("/services/legal-consultation");
    expect(publicFooterContent.practiceLinks.map((link) => link.href)).not.toContain("/services/contract-drafting");
    expect(publicIndustries.length).toBeGreaterThanOrEqual(6);
  });
});
