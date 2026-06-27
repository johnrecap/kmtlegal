ALTER TABLE "articles" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'ar';
ALTER TABLE "case_studies" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'ar';

DROP INDEX "articles_slug_key";
DROP INDEX "case_studies_slug_key";

CREATE UNIQUE INDEX "articles_locale_slug_key" ON "articles"("locale", "slug");
CREATE INDEX "articles_locale_idx" ON "articles"("locale");

CREATE UNIQUE INDEX "case_studies_locale_slug_key" ON "case_studies"("locale", "slug");
CREATE INDEX "case_studies_locale_idx" ON "case_studies"("locale");
