import { stripPublicLocalePrefix } from "./public-locale";

export const publicAnalyticsPages = ["home", "our-firm", "services", "service", "industries", "team", "lawyer", "articles", "article", "contact", "book-consultation", "privacy", "terms"] as const;
export const publicAnalyticsServices = ["legal-consultation", "company-formation", "corporate-business-services", "contracts", "real-estate-legal-support", "claims-collections"] as const;
export type PublicAnalyticsService = typeof publicAnalyticsServices[number];

/** Never forward URLs, query strings, user text or arbitrary slugs into telemetry. */
export function publicAnalyticsContext(pathname: string) {
  const path = stripPublicLocalePrefix(pathname);
  const segments = path.split("/").filter(Boolean);
  const locale = pathname === "/ar" || pathname.startsWith("/ar/") ? "ar" : "en";
  if (!segments.length) return { page: "home" as const, locale };
  if (segments.length === 2 && segments[0] === "services") {
    const service = publicAnalyticsServices.find(value => value === segments[1]);
    return service ? { page: "service" as const, locale, service } : null;
  }
  if (segments.length === 2 && ["team", "articles"].includes(segments[0])) return { page: segments[0] === "team" ? "lawyer" as const : "article" as const, locale };
  const page = publicAnalyticsPages.find(value => value === segments[0]);
  return segments.length === 1 && page && !["home", "service", "lawyer", "article"].includes(page) ? { page, locale } : null;
}
