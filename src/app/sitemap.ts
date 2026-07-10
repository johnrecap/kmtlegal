import type { MetadataRoute } from "next";
import { getPublicContent } from "@/content/public-content";
import { availableAlternatePublicLanguages, localizedPublicHref, type PublicLocale } from "@/lib/public-locale";

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

type LocalizedPath = { path: string; locales: Set<PublicLocale> };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = new Map<string, LocalizedPath>();
  const addPath = (path: string, locale: PublicLocale) => {
    const entry = paths.get(path) ?? { path, locales: new Set<PublicLocale>() };
    entry.locales.add(locale);
    paths.set(path, entry);
  };

  for (const path of staticPublicPaths) {
    addPath(path, "en");
    addPath(path, "ar");
  }

  for (const locale of ["en", "ar"] as const) {
    const content = getPublicContent(locale);
    for (const service of content.legalServices) addPath(`/services/${service.slug}`, locale);
    for (const lawyer of content.lawyers) addPath(`/team/${lawyer.slug}`, locale);
  }

  for (const item of await dbBackedContentPaths()) addPath(item.path, item.locale);

  return Array.from(paths.values()).flatMap(({ path, locales }) =>
    Array.from(locales).map((locale) => sitemapEntry(path, locale, Array.from(locales)))
  );
}

function sitemapEntry(path: string, locale: PublicLocale, availableLocales: PublicLocale[]): MetadataRoute.Sitemap[number] {
  const locales = availableLocales;
  const languages = availableAlternatePublicLanguages(path, locales);

  return {
    url: new URL(localizedPublicHref(path, locale), siteOrigin()).toString(),
    alternates: {
      languages: Object.fromEntries(Object.entries(languages).map(([key, href]) => [key, new URL(href, siteOrigin()).toString()]))
    }
  };
}

async function dbBackedContentPaths(): Promise<Array<{ path: string; locale: PublicLocale }>> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const { listPublishedArticles, listPublishedCaseStudies } = await import("@/server/public/content-service");
    const [englishArticles, arabicArticles, englishCaseStudies, arabicCaseStudies] = await Promise.all([
      listPublishedArticles("en"),
      listPublishedArticles("ar"),
      listPublishedCaseStudies("en"),
      listPublishedCaseStudies("ar")
    ]);

    return [
      ...englishArticles.map((article) => ({ path: `/articles/${article.slug}`, locale: "en" as const })),
      ...arabicArticles.map((article) => ({ path: `/articles/${article.slug}`, locale: "ar" as const })),
      ...englishCaseStudies.map((study) => ({ path: `/case-studies/${study.slug}`, locale: "en" as const })),
      ...arabicCaseStudies.map((study) => ({ path: `/case-studies/${study.slug}`, locale: "ar" as const }))
    ];
  } catch {
    return [];
  }
}

function siteOrigin() {
  return process.env.APP_ORIGIN || "http://localhost:3000";
}
