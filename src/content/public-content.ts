import { publicContentAr } from "./public-content.ar";
import { publicContentEn } from "./public-content.en";
import { resolvePublicServiceSlug } from "./public-services";
import { defaultPublicLocale, type PublicLocale } from "@/lib/public-locale";

export const publicContentByLocale = {
  en: publicContentEn,
  ar: publicContentAr
} as const;

export type PublicContent = (typeof publicContentByLocale)[PublicLocale];
export type PublicLegalService = PublicContent["legalServices"][number];
export type PublicLawyer = PublicContent["lawyers"][number];
export type PublicArticle = PublicContent["articles"][number];
export type PublicCaseStudy = PublicContent["caseStudies"][number];

export function getPublicContent(locale: PublicLocale = defaultPublicLocale): PublicContent {
  return publicContentByLocale[locale];
}

const defaultContent = getPublicContent();

export const publicNavItems = defaultContent.navItems;
export const serviceCategories = defaultContent.serviceCategories;
export const legalServices = defaultContent.legalServices;
export const practiceAreaMatrix = defaultContent.practiceAreaMatrix;
export const lawyers = defaultContent.lawyers;
export const articles = defaultContent.articles;
export const caseStudies = defaultContent.caseStudies;
export const representativeMatters = defaultContent.representativeMatters;
export const mediaItems = defaultContent.mediaItems;
export const publicIndustries = defaultContent.publicIndustries;
export const branches = defaultContent.branches;
export const publicFooterContent = defaultContent.footerContent;

export function navForPath(pathname: string, locale: PublicLocale = defaultPublicLocale) {
  const content = getPublicContent(locale);

  return content.navItems.map((item) => ({
    ...item,
    active: item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  }));
}

export function findBySlug<T extends { slug: string }>(items: readonly T[], slug: string) {
  return items.find((item) => item.slug === slug);
}

export function findPublicService(locale: PublicLocale, slug: string) {
  const canonicalSlug = resolvePublicServiceSlug(slug);
  return getPublicContent(locale).legalServices.find((item) => item.slug === canonicalSlug);
}

export function canonicalPublicServiceSlug(slug: string) {
  return resolvePublicServiceSlug(slug);
}

export function publicSearchText(value: unknown) {
  return JSON.stringify(value).toLowerCase();
}
