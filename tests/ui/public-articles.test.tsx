import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArticleDetailPageView, ArticlesPageView } from "@/features/public-site/public-pages";
import {
  getPublishedArticleBySlug,
  listPublishedArticleCards
} from "@/server/public/content-service";

vi.mock("@/server/public/content-service", () => ({
  listPublishedArticleCards: vi.fn().mockResolvedValue([]),
  listPublishedCaseStudyCards: vi.fn().mockResolvedValue([]),
  getPublishedArticleBySlug: vi.fn().mockResolvedValue(null),
  getPublishedCaseStudyBySlug: vi.fn().mockResolvedValue(null)
}));

process.env.DATABASE_URL = "postgresql://kmt_legal:test@localhost:5433/kmt_legal";

type ArticleDto = NonNullable<Awaited<ReturnType<typeof getPublishedArticleBySlug>>>;
type ArticleCardDto = Awaited<ReturnType<typeof listPublishedArticleCards>>[number];

const articleFixture: ArticleDto = {
  title: "Contract Risk Basics",
  slug: "contract-risk-basics",
  locale: "en",
  category: "contracts",
  excerpt: "Practical points for reviewing liability and penalty clauses before signing.",
  content: [
    "Contract review starts with the core obligations and timelines.",
    "## Liability and penalties",
    "Penalty clauses deserve special attention before signing.",
    "- Cap your liability exposure explicitly\n- Align penalties with actual expected damages\n- Never rely on the contract price alone"
  ].join("\n\n"),
  author: "Mariam Khalid",
  publishedAt: "2026-06-01",
  readTime: "2 min read"
};

const cardFixture: ArticleCardDto = {
  author: "Mariam Khalid",
  title: articleFixture.title,
  slug: articleFixture.slug,
  locale: "en",
  category: articleFixture.category,
  excerpt: articleFixture.excerpt,
  publishedAt: articleFixture.publishedAt,
  readTime: "2 min read"
};

const relatedFixture: ArticleCardDto = {
  author: null,
  title: "Termination Clauses in Practice",
  slug: "termination-clauses",
  locale: "en",
  category: "contracts",
  excerpt: "What to check before signing a commercial termination clause.",
  publishedAt: "2026-05-10",
  readTime: "3 min read"
};

describe("public articles UI", () => {
  beforeEach(() => {
    vi.mocked(listPublishedArticleCards).mockResolvedValue([]);
    vi.mocked(getPublishedArticleBySlug).mockResolvedValue(null);
  });

  it("distinguishes an empty published collection from a failed database read", async () => {
    const empty = renderToStaticMarkup(await ArticlesPageView({ locale: "en" }));
    expect(empty).not.toContain("Articles are temporarily unavailable");
    vi.mocked(listPublishedArticleCards).mockRejectedValue(new Error("database unavailable"));
    const failed = renderToStaticMarkup(await ArticlesPageView({ locale: "en" }));
    expect(failed).toContain("Articles are temporarily unavailable");
    expect(failed).toContain("Try again");
  });

  it("escapes CMS titles inside structured data", async () => {
    vi.mocked(getPublishedArticleBySlug).mockResolvedValue({ ...articleFixture, title: "</script><script>alert(1)</script>" });
    const html = renderToStaticMarkup(await ArticleDetailPageView({ locale: "en", slug: articleFixture.slug }));
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("\\u003c/script>");
  });

  it("renders the list with the nav-aligned title, gold category chip, and read-time meta", async () => {
    vi.mocked(listPublishedArticleCards).mockResolvedValue([cardFixture, relatedFixture]);
    const html = renderToStaticMarkup(await ArticlesPageView({ locale: "en" }));

    expect(html).toContain("%2Fsite-assets%2F2c0d439a80ab607f-9dddafeec7.webp");
    expect(html).toContain("Insights</h1>");
    expect(html).not.toContain("Practical Legal Reading");
    expect(html).toContain("href=\"/articles/contract-risk-basics\"");
    expect(html).toContain(">Contracts</span>");
    expect(html).toContain("2 min read</bdi>");
  });

  it("renders detail with h1, breadcrumbs, byline, time, rich-text body, warning disclaimer, and related cards", async () => {
    vi.mocked(getPublishedArticleBySlug).mockResolvedValue(articleFixture);
    vi.mocked(listPublishedArticleCards).mockResolvedValue([cardFixture, relatedFixture]);
    const html = renderToStaticMarkup(await ArticleDetailPageView({ locale: "en", slug: articleFixture.slug }));
    const source = readFileSync("src/features/public-site/public-pages.tsx", "utf8");

    expect(html).toContain("<h1");
    expect(html).toContain("Contract Risk Basics</h1>");
    expect(html).toContain("aria-label=\"Breadcrumb\"");
    expect(html).toContain("href=\"/articles\"");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain("\"name\":\"Insights\"");
    expect(html).toContain("\"name\":\"Contracts\"");
    expect(html).toContain("By <span");
    expect(html).toContain("Mariam Khalid</span>");
    expect(html).toContain("<time dateTime=\"2026-06-01\">");
    expect(html).toContain("June 1, 2026");
    expect(html).toContain("2 min read</p>");
    expect(html).toContain("<h2 class=\"pt-2");
    expect(html).toContain("Liability and penalties</h2>");
    expect(html).toContain("<ul");
    expect(html).toContain("list-disc");
    expect(html).toContain("Cap your liability exposure explicitly");
    expect(html).toContain("bg-kmt-warning-surface");
    expect(html).toContain("text-kmt-warning-strong");
    expect(html).not.toContain("bg-amber-950");
    expect(html).toContain("Related Reading</h2>");
    expect(html).toContain("href=\"/articles/termination-clauses\"");
    expect(html).not.toContain("href=\"/articles/contract-risk-basics\""); // current article excluded from related
    expect(html).toContain("href=\"/ar/articles/contract-risk-basics\"");
    expect(html).toContain("reading-progress");
    expect(source).toMatch(/max-w-\[65ch\]/);
  });

  it("renders the Arabic detail with RTL breadcrumbs, Arabic byline, and localized date", async () => {
    vi.mocked(getPublishedArticleBySlug).mockResolvedValue({
      ...articleFixture,
      locale: "ar",
      author: null,
      readTime: "2 دقائق"
    });
    vi.mocked(listPublishedArticleCards).mockResolvedValue([]);
    const html = renderToStaticMarkup(await ArticleDetailPageView({ locale: "ar", slug: articleFixture.slug }));

    expect(html).toContain("dir=\"rtl\"");
    expect(html).toContain("lang=\"ar\"");
    expect(html).toContain("المقالات");
    expect(html).toContain("بقلم");
    expect(html).toContain("مكتب KMT Legal");
    expect(html).toContain("١ يونيو ٢٠٢٦");
    expect(html).not.toContain("Related Reading");
  });
});
