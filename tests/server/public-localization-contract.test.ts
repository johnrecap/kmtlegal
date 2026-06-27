import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  documentLocaleForPath,
  localizedPublicHref,
  publicLocaleDirection,
  stripPublicLocalePrefix
} from "@/lib/public-locale";

describe("public localization contract", () => {
  it("keeps public English default, Arabic under /ar, and protected routes Arabic", () => {
    expect(documentLocaleForPath("/")).toBe("en");
    expect(publicLocaleDirection(documentLocaleForPath("/"))).toBe("ltr");
    expect(documentLocaleForPath("/ar/services")).toBe("ar");
    expect(publicLocaleDirection(documentLocaleForPath("/ar/services"))).toBe("rtl");
    expect(documentLocaleForPath("/admin")).toBe("ar");
    expect(documentLocaleForPath("/portal/cases")).toBe("ar");
  });

  it("localizes public links without translating slugs", () => {
    expect(localizedPublicHref("/services/corporate-law", "en")).toBe("/services/corporate-law");
    expect(localizedPublicHref("/services/corporate-law", "ar")).toBe("/ar/services/corporate-law");
    expect(stripPublicLocalePrefix("/ar/services/corporate-law")).toBe("/services/corporate-law");
  });

  it("documents Article and CaseStudy locale-aware slug uniqueness in Prisma", () => {
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const migration = readFileSync(
      join(process.cwd(), "prisma/migrations/20260627090000_plan_29_public_localization/migration.sql"),
      "utf8"
    );

    expect(schema).toContain('locale      String        @default("ar")');
    expect(schema).toContain('locale         String          @default("ar")');
    expect(schema).toContain("@@unique([locale, slug])");
    expect(migration).toContain('DROP INDEX "articles_slug_key"');
    expect(migration).toContain('CREATE UNIQUE INDEX "articles_locale_slug_key" ON "articles"("locale", "slug")');
    expect(migration).toContain('CREATE UNIQUE INDEX "case_studies_locale_slug_key" ON "case_studies"("locale", "slug")');
  });
});
