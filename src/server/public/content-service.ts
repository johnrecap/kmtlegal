import { prisma } from "@/server/db/prisma";
import { defaultPublicLocale, type PublicLocale } from "@/lib/public-locale";

export const PUBLIC_CASE_STUDY_DISCLAIMER = {
  ar: "هذه دراسة حالة مجهولة ومبسطة لأغراض توعوية فقط، ولا تتضمن بيانات عملاء أو مستندات أو أرقام قضايا، ولا تمثل استشارة أو وعدًا بنتيجة قانونية.",
  en: "This anonymized, simplified case study is for general awareness only. It does not include client data, documents, or case numbers, and it is not legal advice or a promised outcome."
} as const;

function readTimeFor(content: string, locale: PublicLocale) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return locale === "ar" ? `${minutes} دقائق` : `${minutes} min read`;
}

function articleDto(article: {
  title: string;
  slug: string;
  locale: string;
  category: string;
  excerpt: string;
  content: string;
  publishedAt: Date | null;
}, locale: PublicLocale) {
  return {
    title: article.title,
    slug: article.slug,
    locale: article.locale,
    category: article.category,
    excerpt: article.excerpt,
    content: article.content,
    publishedAt: article.publishedAt?.toISOString().slice(0, 10) ?? "",
    readTime: readTimeFor(article.content, locale)
  };
}

function caseStudyDto(study: {
  title: string;
  slug: string;
  locale: string;
  category: string;
  challenge: string;
  approach: string;
  generalOutcome: string;
  lessons: string;
  publishedAt: Date | null;
}, locale: PublicLocale) {
  return {
    title: study.title,
    slug: study.slug,
    locale: study.locale,
    category: study.category,
    summary: study.challenge,
    challenge: study.challenge,
    approach: study.approach,
    generalOutcome: study.generalOutcome,
    lessons: study.lessons,
    publishedAt: study.publishedAt?.toISOString().slice(0, 10) ?? "",
    disclaimer: PUBLIC_CASE_STUDY_DISCLAIMER[locale]
  };
}

export async function listPublishedArticles(locale: PublicLocale = defaultPublicLocale) {
  const articles = await prisma.article.findMany({
    where: { locale, status: "PUBLISHED", publishedAt: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      title: true,
      slug: true,
      locale: true,
      category: true,
      excerpt: true,
      content: true,
      publishedAt: true
    }
  });

  return articles.map((article) => articleDto(article, locale));
}

export async function getPublishedArticleBySlug(locale: PublicLocale = defaultPublicLocale, slug: string) {
  const article = await prisma.article.findFirst({
    where: { locale, slug, status: "PUBLISHED", publishedAt: { not: null } },
    select: {
      title: true,
      slug: true,
      locale: true,
      category: true,
      excerpt: true,
      content: true,
      publishedAt: true
    }
  });

  return article ? articleDto(article, locale) : null;
}

export async function listPublishedCaseStudies(locale: PublicLocale = defaultPublicLocale) {
  const studies = await prisma.caseStudy.findMany({
    where: { locale, status: "PUBLISHED", isAnonymized: true, publishedAt: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      title: true,
      slug: true,
      locale: true,
      category: true,
      challenge: true,
      approach: true,
      generalOutcome: true,
      lessons: true,
      publishedAt: true
    }
  });

  return studies.map((study) => caseStudyDto(study, locale));
}

export async function getPublishedCaseStudyBySlug(locale: PublicLocale = defaultPublicLocale, slug: string) {
  const study = await prisma.caseStudy.findFirst({
    where: { locale, slug, status: "PUBLISHED", isAnonymized: true, publishedAt: { not: null } },
    select: {
      title: true,
      slug: true,
      locale: true,
      category: true,
      challenge: true,
      approach: true,
      generalOutcome: true,
      lessons: true,
      publishedAt: true
    }
  });

  return study ? caseStudyDto(study, locale) : null;
}
