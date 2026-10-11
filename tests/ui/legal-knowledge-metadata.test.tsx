import { describe, expect, it, vi } from "vitest";
import { metadataForPublicPath } from "@/features/public-site/public-pages";
import { getKnowledge } from "@/server/public/knowledge-service";

vi.mock("@/server/public/knowledge-service", () => ({ getKnowledge: vi.fn() }));

const reference = { title: "Reviewed reference", excerpt: "Source summary" } as NonNullable<Awaited<ReturnType<typeof getKnowledge>>>;

describe("published legal reference language metadata", () => {
  it("links both published translations", async () => {
    vi.mocked(getKnowledge).mockResolvedValue(reference);
    const metadata = await metadataForPublicPath("ar", ["legal-intelligence", "sample"]);
    expect(metadata.alternates?.canonical).toBe("/ar/legal-intelligence/sample");
    expect(metadata.alternates?.languages).toEqual({ en: "/legal-intelligence/sample", ar: "/ar/legal-intelligence/sample", "x-default": "/legal-intelligence/sample" });
  });
  it("does not advertise an unavailable translation", async () => {
    vi.mocked(getKnowledge).mockImplementation(async locale => locale === "ar" ? reference : null);
    const metadata = await metadataForPublicPath("ar", ["legal-intelligence", "sample"]);
    expect(metadata.alternates?.languages).toEqual({ ar: "/ar/legal-intelligence/sample", "x-default": "/ar/legal-intelligence/sample" });
  });
  it("does not emit reference metadata for an unpublished page", async () => {
    vi.mocked(getKnowledge).mockResolvedValue(null);
    expect(await metadataForPublicPath("en", ["legal-intelligence", "sample"])).toEqual({});
  });
});
