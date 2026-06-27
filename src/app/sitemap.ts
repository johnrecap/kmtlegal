import type { MetadataRoute } from "next";
import { getPublicContent } from "@/content/public-content";
import { alternatePublicLanguages, localizedPublicHref, type PublicLocale } from "@/lib/public-locale";

const staticPublicPaths = [
  "/",
  "/services",
  "/team",
  "/articles",
  "/case-studies",
  "/media",
  "/contact",
  "/book-consultation",
  "/privacy",
  "/terms"
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = new Set<string>(staticPublicPaths);
  const content = getPublicContent("en");

  for (const service of content.legalServices) {
    paths.add(`/services/${service.slug}`);
  }

  for (const lawyer of content.lawyers) {
    paths.add(`/team/${lawyer.slug}`);
  }

  for (const path of await dbBackedContentPaths()) {
    paths.add(path);
  }

  return Array.from(paths).flatMap((path) => [
    sitemapEntry(path, "en"),
    sitemapEntry(path, "ar")
  ]);
}

function sitemapEntry(path: string, locale: PublicLocale): MetadataRoute.Sitemap[number] {
  const url = new URL(localizedPublicHref(path, locale), siteOrigin()).toString();
  const alternates = alternatePublicLanguages(path);

  return {
    url,
    lastModified: new Date(),
    alternates: {
      languages: {
        en: new URL(alternates.en, siteOrigin()).toString(),
        ar: new URL(alternates.ar, siteOrigin()).toString(),
        "x-default": new URL(alternates["x-default"], siteOrigin()).toString()
      }
    }
  };
}

async function dbBackedContentPaths() {
  if (!shouldLoadDatabaseContent()) {
    return [];
  }

  try {
    const { listPublishedArticles, listPublishedCaseStudies } = await import("@/server/public/content-service");
    const [englishArticles, arabicArticles, englishCaseStudies, arabicCaseStudies] = await Promise.all([
      listPublishedArticles("en"),
      listPublishedArticles("ar"),
      listPublishedCaseStudies("en"),
      listPublishedCaseStudies("ar")
    ]);

    return [
      ...englishArticles.map((article) => `/articles/${article.slug}`),
      ...arabicArticles.map((article) => `/articles/${article.slug}`),
      ...englishCaseStudies.map((study) => `/case-studies/${study.slug}`),
      ...arabicCaseStudies.map((study) => `/case-studies/${study.slug}`)
    ];
  } catch {
    return [];
  }
}

function shouldLoadDatabaseContent() {
  return Boolean(process.env.DATABASE_URL);
}

function siteOrigin() {
  return process.env.APP_ORIGIN || "http://localhost:3000";
}
