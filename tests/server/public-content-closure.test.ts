import { afterEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  listPublishedArticleCards: vi.fn(async () => [{ slug: "leak-probe", title: "LEAK MARKER ARTICLE" }]),
  getPublishedArticleBySlug: vi.fn(async () => ({ slug: "leak-probe", title: "LEAK MARKER ARTICLE" })),
  listPublishedCaseStudies: vi.fn(async () => [{ slug: "leak-probe", title: "LEAK MARKER STUDY" }]),
  getPublishedCaseStudyBySlug: vi.fn(async () => ({ slug: "leak-probe", title: "LEAK MARKER STUDY" }))
}));

vi.mock("@/server/public/content-service", () => ({ ...serviceMocks }));

import { GET as articlesList } from "@/app/api/public/articles/route";
import { GET as articleDetail } from "@/app/api/public/articles/[slug]/route";
import { GET as studiesList } from "@/app/api/public/case-studies/route";
import { GET as studyDetail } from "@/app/api/public/case-studies/[slug]/route";

async function readJson(response: Response) {
  expect(response.status).toBe(404);
  const body = (await response.json()) as { data?: unknown; error?: { code?: string } };
  return { body, text: JSON.stringify(body) };
}

describe("hidden public content APIs closure (TASK 02)", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
  it("restores published articles through the existing service", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://synthetic.invalid/test");
    const response = await articlesList(new Request("http://localhost/api/public/articles?locale=en"));
    expect(response.status).toBe(200);
    expect((await response.json()).data[0].slug).toBe("leak-probe");
    expect(serviceMocks.listPublishedArticleCards).toHaveBeenCalledWith("en");
    const detail = await articleDetail(new Request("http://localhost/api/public/articles/leak-probe?locale=ar"), { params: Promise.resolve({ slug: "leak-probe" }) });
    expect(detail.status).toBe(200);
    expect(serviceMocks.getPublishedArticleBySlug).toHaveBeenCalledWith("ar", "leak-probe");
  });
  it("distinguishes an unavailable database from an empty collection", async () => {
    vi.stubEnv("DATABASE_URL", "");
    expect((await articlesList(new Request("http://localhost/api/public/articles"))).status).toBe(503);
    expect(serviceMocks.listPublishedArticleCards).not.toHaveBeenCalled();
  });

  it("case studies list returns 404 without content or service reads", async () => {
    const { body, text } = await readJson(await studiesList(new Request("http://localhost/api/public/case-studies?locale=ar")));
    expect(body.error?.code).toBe("NOT_FOUND");
    expect(body.data).toBeUndefined();
    expect(text).not.toContain("LEAK MARKER STUDY");
    expect(serviceMocks.listPublishedCaseStudies).not.toHaveBeenCalled();
  });

  it("case study detail returns 404 for a known published slug without service reads", async () => {
    const { body, text } = await readJson(
      await studyDetail(new Request("http://localhost/api/public/case-studies/leak-probe?locale=ar"))
    );
    expect(body.error?.code).toBe("NOT_FOUND");
    expect(body.data).toBeUndefined();
    expect(text).not.toContain("LEAK MARKER STUDY");
    expect(serviceMocks.getPublishedCaseStudyBySlug).not.toHaveBeenCalled();
  });
});
