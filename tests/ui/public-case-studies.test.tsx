import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CaseStudiesPageView, CaseStudyDetailPageView } from "@/features/public-site/public-pages";
import {
  getPublishedCaseStudyBySlug,
  listPublishedCaseStudyCards
} from "@/server/public/content-service";

vi.mock("@/server/public/content-service", () => ({
  listPublishedArticleCards: vi.fn().mockResolvedValue([]),
  listPublishedCaseStudyCards: vi.fn().mockResolvedValue([]),
  getPublishedArticleBySlug: vi.fn().mockResolvedValue(null),
  getPublishedCaseStudyBySlug: vi.fn().mockResolvedValue(null)
}));

process.env.DATABASE_URL = "postgresql://kmt_legal:test@localhost:5433/kmt_legal";

type StudyDto = NonNullable<Awaited<ReturnType<typeof getPublishedCaseStudyBySlug>>>;
type StudyCardDto = Awaited<ReturnType<typeof listPublishedCaseStudyCards>>[number];

const studyFixture: StudyDto = {
  title: "Anonymous Commercial Dispute",
  slug: "anonymous-commercial-dispute",
  locale: "en",
  category: "commercial",
  summary: "Delayed contractual dues with incomplete correspondence records.",
  challenge: "Delayed contractual dues with incomplete correspondence records.",
  approach: "Document review and structured claims and risk mapping before negotiation.",
  generalOutcome: "General anonymized outcome without promises or real-party data.",
  lessons: "Documented correspondence and acceptance reduce later dispute surface.",
  publishedAt: "2026-06-05",
  disclaimer: "This anonymized, simplified case study is for general awareness only. It does not include client data, documents, or case numbers, and it is not legal advice or a promised outcome."
};

const cardFixture: StudyCardDto = {
  title: studyFixture.title,
  slug: studyFixture.slug,
  locale: "en",
  category: studyFixture.category,
  summary: studyFixture.summary,
  publishedAt: studyFixture.publishedAt,
  disclaimer: studyFixture.disclaimer
};

describe("public case studies UI", () => {
  beforeEach(() => {
    vi.mocked(listPublishedCaseStudyCards).mockResolvedValue([]);
    vi.mocked(getPublishedCaseStudyBySlug).mockResolvedValue(null);
  });

  it("renders the list with a distinct hero image and category + year meta instead of repeated Anonymous", async () => {
    vi.mocked(listPublishedCaseStudyCards).mockResolvedValue([cardFixture]);
    const html = renderToStaticMarkup(await CaseStudiesPageView({ locale: "en" }));

    expect(html).toContain("%2Fstitch-assets%2F927e808522dfd86d.png");
    expect(html).not.toContain("%2Fstitch-assets%2F2484f68d86633ca8.png");
    expect(html).toContain("Every published case study here is anonymized and simplified");
    expect(html).toContain("href=\"/case-studies/anonymous-commercial-dispute\"");
    expect(html).toContain(">commercial</span>");
    expect(html).toContain("<bdi>2026</bdi>");
    expect(html).not.toContain(">Anonymous</bdi>");
  });

  it("renders detail with h1, breadcrumbs, numbered reveal blocks, warning-token disclaimer, and alternate link", async () => {
    vi.mocked(getPublishedCaseStudyBySlug).mockResolvedValue(studyFixture);
    const html = renderToStaticMarkup(await CaseStudyDetailPageView({ locale: "en", slug: studyFixture.slug }));
    const source = readFileSync("src/features/public-site/public-pages.tsx", "utf8");

    expect(html).toContain("<h1");
    expect(html).toContain("Anonymous Commercial Dispute</h1>");
    expect(html).toContain("aria-label=\"Breadcrumb\"");
    expect(html).toContain("href=\"/case-studies\"");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain("\"name\":\"Case Studies\"");
    expect(html).toContain("tabular-nums");
    expect(html).toContain("<bdi>01</bdi>");
    expect(html).toContain("<bdi>02</bdi>");
    expect(html).toContain("<bdi>03</bdi>");
    expect(html).toContain("<bdi>04</bdi>");
    expect(html).toContain(">Challenge</h2>");
    expect(html).toContain(">Approach</h2>");
    expect(html).toContain(">General Outcome</h2>");
    expect(html).toContain(">Lessons</h2>");
    expect(html).toContain("bg-kmt-warning-surface");
    expect(html).toContain("text-kmt-warning-strong");
    expect(html).toContain("border-kmt-warning-border");
    expect(html).not.toContain("bg-amber-950");
    expect(html).toContain("June 5, 2026");
    expect(html).toContain("href=\"/ar/case-studies/anonymous-commercial-dispute\"");
    expect(html).toContain("href=\"/case-studies\"");
    expect(source).toMatch(/delay=\{index \* 60\}/);
  });

  it("renders the Arabic detail with RTL breadcrumbs and localized year", async () => {
    vi.mocked(getPublishedCaseStudyBySlug).mockResolvedValue({ ...studyFixture, locale: "ar" });
    const html = renderToStaticMarkup(await CaseStudyDetailPageView({ locale: "ar", slug: studyFixture.slug }));

    expect(html).toContain("dir=\"rtl\"");
    expect(html).toContain("lang=\"ar\"");
    expect(html).toContain("دراسات الحالة");
    expect(html).toContain(">التحدي</h2>");
    expect(html).toContain(">الدروس</h2>");
    expect(html).toContain("٢٠٢٦");
    expect(html).not.toContain(">Anonymous</bdi>");
  });
});
