export const publicLocales = ["en", "ar"] as const;

export type PublicLocale = (typeof publicLocales)[number];

export const defaultPublicLocale: PublicLocale = "en";
export const arabicPublicLocale: PublicLocale = "ar";

const protectedPathPrefixes = ["/admin", "/client", "/portal", "/install", "/login", "/product-system", "/stitch-clone"];

export function isPublicLocale(value: unknown): value is PublicLocale {
  return value === "en" || value === "ar";
}

export function normalizePublicLocale(value: unknown): PublicLocale {
  return isPublicLocale(value) ? value : defaultPublicLocale;
}

export function publicLocaleDirection(locale: PublicLocale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function publicLocalePrefix(locale: PublicLocale) {
  return locale === "ar" ? "/ar" : "";
}

export function isArabicPublicPath(pathname: string) {
  return pathname === "/ar" || pathname.startsWith("/ar/");
}

export function stripPublicLocalePrefix(pathname: string) {
  if (pathname === "/ar") {
    return "/";
  }

  if (pathname.startsWith("/ar/")) {
    return pathname.slice(3) || "/";
  }

  return pathname;
}

export function publicLocaleFromPath(pathname: string): PublicLocale {
  return isArabicPublicPath(pathname) ? "ar" : "en";
}

export function isProtectedProductPath(pathname: string) {
  return protectedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function documentLocaleForPath(pathname: string): PublicLocale {
  if (isProtectedProductPath(pathname)) {
    return "ar";
  }

  return publicLocaleFromPath(pathname);
}

export function localizedPublicHref(href: string, locale: PublicLocale) {
  if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) {
    return href;
  }

  const prefix = publicLocalePrefix(locale);
  if (!prefix) {
    return stripPublicLocalePrefix(href);
  }

  const path = stripPublicLocalePrefix(href);
  return path === "/" ? prefix : `${prefix}${path}`;
}

export function alternatePublicLanguages(pathname: string) {
  const path = stripPublicLocalePrefix(pathname);
  const arPath = path === "/" ? "/ar" : `/ar${path}`;

  return {
    en: path,
    ar: arPath,
    "x-default": path
  };
}

export function availableAlternatePublicLanguages(pathname: string, locales: readonly PublicLocale[]) {
  const all = alternatePublicLanguages(pathname);
  const languages: Record<string, string> = {};
  if (locales.includes("en")) languages.en = all.en;
  if (locales.includes("ar")) languages.ar = all.ar;
  languages["x-default"] = locales.includes("en") ? all.en : all.ar;
  return languages;
}

export function localeFromSearchParams(searchParams: URLSearchParams): PublicLocale {
  return normalizePublicLocale(searchParams.get("locale"));
}
