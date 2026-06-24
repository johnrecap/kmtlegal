import { prisma } from "@/server/db/prisma";

export const PUBLIC_CASE_STUDY_DISCLAIMER =
  "هذه دراسة حالة مجهولة ومبسطة لأغراض توعوية فقط، ولا تتضمن بيانات عملاء أو مستندات أو أرقام قضايا، ولا تمثل استشارة أو وعدًا بنتيجة قانونية.";

function readTimeFor(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} دقائق`;
}

function articleDto(article: {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  publishedAt: Date | null;
}) {
  return {
    title: article.title,
    slug: article.slug,
    category: article.category,
    excerpt: article.excerpt,
    content: article.content,
    publishedAt: article.publishedAt?.toISOString().slice(0, 10) ?? "",
    readTime: readTimeFor(article.content)
  };
}

function caseStudyDto(study: {
  title: string;
  slug: string;
  category: string;
  challenge: string;
  approach: string;
  generalOutcome: string;
  lessons: string;
  publishedAt: Date | null;
}) {
  return {
    title: study.title,
    slug: study.slug,
    category: study.category,
    summary: study.challenge,
    challenge: study.challenge,
    approach: study.approach,
    generalOutcome: study.generalOutcome,
    lessons: study.lessons,
    publishedAt: study.publishedAt?.toISOString().slice(0, 10) ?? "",
    disclaimer: PUBLIC_CASE_STUDY_DISCLAIMER
  };
}

export async function listPublishedArticles() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      title: true,
      slug: true,
      category: true,
      excerpt: true,
      content: true,
      publishedAt: true
    }
  });

  return articles.map(articleDto);
}

export async function getPublishedArticleBySlug(slug: string) {
  const article = await prisma.article.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { not: null } },
    select: {
      title: true,
      slug: true,
      category: true,
      excerpt: true,
      content: true,
      publishedAt: true
    }
  });

  return article ? articleDto(article) : null;
}

export async function listPublishedCaseStudies() {
  const studies = await prisma.caseStudy.findMany({
    where: { status: "PUBLISHED", isAnonymized: true, publishedAt: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      title: true,
      slug: true,
      category: true,
      challenge: true,
      approach: true,
      generalOutcome: true,
      lessons: true,
      publishedAt: true
    }
  });

  return studies.map(caseStudyDto);
}

export async function getPublishedCaseStudyBySlug(slug: string) {
  const study = await prisma.caseStudy.findFirst({
    where: { slug, status: "PUBLISHED", isAnonymized: true, publishedAt: { not: null } },
    select: {
      title: true,
      slug: true,
      category: true,
      challenge: true,
      approach: true,
      generalOutcome: true,
      lessons: true,
      publishedAt: true
    }
  });

  return study ? caseStudyDto(study) : null;
}
