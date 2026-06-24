import { describe, expect, it } from "vitest";
import { articles, caseStudies, legalServices, lawyers, navForPath, publicSearchText } from "@/content/public-content";

describe("public content contracts", () => {
  it("provides public routes with stable slugs", () => {
    expect(legalServices.map((service) => service.slug)).toContain("contract-drafting");
    expect(lawyers.map((lawyer) => lawyer.slug)).toContain("maryam-khaled");
    expect(articles.map((article) => article.slug)).toContain("contract-risk-basics");
    expect(caseStudies.map((study) => study.slug)).toContain("anonymous-commercial-dispute");
  });

  it("marks active navigation without duplicating destinations", () => {
    const nav = navForPath("/services/contract-drafting");
    expect(nav.find((item) => item.href === "/services")?.active).toBe(true);
    expect(new Set(nav.map((item) => item.href)).size).toBe(nav.length);
  });

  it("keeps public content free of obvious private document or case identifiers", () => {
    const serialized = publicSearchText({ legalServices, lawyers, articles, caseStudies });
    expect(serialized).not.toMatch(/KMT-\d{4}-\d+/i);
    expect(serialized).not.toContain("filekey");
    expect(serialized).not.toContain("password");
  });

  it("requires public case studies to carry disclaimers", () => {
    expect(caseStudies.every((study) => study.disclaimer.includes("لا") || study.disclaimer.includes("مجهولة"))).toBe(true);
  });
});
