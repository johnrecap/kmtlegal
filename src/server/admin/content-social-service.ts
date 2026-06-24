import { Prisma } from "@prisma/client";
import { z } from "zod";
import { articleStatusValues, caseStudyStatusValues, socialDraftStatusValues, socialPlatformValues } from "@/lib/legal-content";
import { AI_REVIEW_DISCLAIMER } from "@/server/ai/copy";
import { generateStructured } from "@/server/ai/gateway";
import { socialPostDraftOutputSchema } from "@/server/ai/schemas";
import { appendAuditLog } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { toPagination } from "@/server/http/pagination";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";

const slugSchema = z.string().trim().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case.");
const optionalDateStringSchema = z.string().trim().max(60).optional().or(z.literal(""));
const articleStatusSchema = z.enum(articleStatusValues);
const caseStudyStatusSchema = z.enum(caseStudyStatusValues);
const socialDraftStatusSchema = z.enum(socialDraftStatusValues);
const socialPlatformSchema = z.enum(socialPlatformValues);
const contentTabSchema = z.enum(["articles", "case-studies", "social", "pending"]);
const contentSortBySchema = z.enum(["updatedAt", "createdAt", "publishedAt", "scheduledAt", "title"]);

export const adminContentHubQuerySchema = z.object({
  tab: contentTabSchema.default("articles"),
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.string().trim().max(40).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  platform: socialPlatformSchema.optional().or(z.literal("")),
  sortBy: contentSortBySchema.default("updatedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(80).default(30)
});

export const adminArticleWriteSchema = z
  .object({
    title: z.string().trim().min(3).max(180),
    slug: slugSchema,
    excerpt: z.string().trim().min(20).max(500),
    content: z.string().trim().min(30).max(20_000),
    category: z.string().trim().min(2).max(80),
    status: articleStatusSchema.default("DRAFT"),
    publishedAt: optionalDateStringSchema
  })
  .strict();

export const adminCaseStudyWriteSchema = z
  .object({
    title: z.string().trim().min(3).max(180),
    slug: slugSchema,
    category: z.string().trim().min(2).max(80),
    challenge: z.string().trim().min(20).max(5000),
    approach: z.string().trim().min(20).max(5000),
    generalOutcome: z.string().trim().min(20).max(5000),
    lessons: z.string().trim().min(20).max(5000),
    status: caseStudyStatusSchema.default("DRAFT"),
    isAnonymized: z.coerce.boolean().default(false),
    publishedAt: optionalDateStringSchema
  })
  .strict();

export const adminSocialDraftWriteSchema = z
  .object({
    title: z.string().trim().min(3).max(180),
    platform: socialPlatformSchema,
    content: z.string().trim().min(10).max(5000),
    sourceType: z.string().trim().max(80).optional().or(z.literal("")),
    sourceId: z.string().trim().max(120).optional().or(z.literal("")),
    status: socialDraftStatusSchema.default("DRAFT"),
    scheduledAt: optionalDateStringSchema
  })
  .strict();

export const adminSocialAiDraftSchema = z
  .object({
    title: z.string().trim().min(3).max(180),
    platform: socialPlatformSchema.default("linkedin"),
    sourceType: z.string().trim().max(80).optional().or(z.literal("manual")),
    sourceId: z.string().trim().max(120).optional().or(z.literal("")),
    sourceText: z.string().trim().min(20).max(4000),
    locale: z.enum(["ar", "en"]).default("ar")
  })
  .strict();

export type AdminContentHubQuery = z.infer<typeof adminContentHubQuerySchema>;
export type AdminArticleWriteInput = z.infer<typeof adminArticleWriteSchema>;
export type AdminCaseStudyWriteInput = z.infer<typeof adminCaseStudyWriteSchema>;
export type AdminSocialDraftWriteInput = z.infer<typeof adminSocialDraftWriteSchema>;
type ArticleStatusValue = (typeof articleStatusValues)[number];
type CaseStudyStatusValue = (typeof caseStudyStatusValues)[number];
type SocialDraftStatusValue = (typeof socialDraftStatusValues)[number];

type PendingRow = {
  id: string;
  type: "article" | "caseStudy" | "social";
  title: string;
  status: string;
  category?: string | null;
  platform?: string | null;
  updatedAt: Date;
  createdAt: Date;
  href: string;
};

export function canAccessContentHub(actor: Principal) {
  return (
    hasPermission(actor, "content.create.any") ||
    hasPermission(actor, "content.approve.any") ||
    hasPermission(actor, "caseStudy.create.any") ||
    hasPermission(actor, "caseStudy.approve.any") ||
    hasPermission(actor, "socialDraft.create.any") ||
    hasPermission(actor, "socialDraft.approve.any")
  );
}

export function canCreateArticles(actor: Principal) {
  return hasPermission(actor, "content.create.any");
}

export function canApproveArticles(actor: Principal) {
  return hasPermission(actor, "content.approve.any");
}

export function canCreateCaseStudies(actor: Principal) {
  return hasPermission(actor, "caseStudy.create.any");
}

export function canApproveCaseStudies(actor: Principal) {
  return hasPermission(actor, "caseStudy.approve.any");
}

export function canCreateSocialDrafts(actor: Principal) {
  return hasPermission(actor, "socialDraft.create.any");
}

export function canApproveSocialDrafts(actor: Principal) {
  return hasPermission(actor, "socialDraft.approve.any");
}

function assertContentAccess(actor: Principal) {
  if (!canAccessContentHub(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Content hub permission is required.");
  }
}

function assertCreateArticle(actor: Principal) {
  if (!canCreateArticles(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Article create permission is required.");
  }
}

function assertCreateCaseStudy(actor: Principal) {
  if (!canCreateCaseStudies(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Case study create permission is required.");
  }
}

function assertCreateSocialDraft(actor: Principal) {
  if (!canCreateSocialDrafts(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Social draft create permission is required.");
  }
}

export function assertArticleStatusAllowed(actor: Principal, status: string) {
  if ((status === "PUBLISHED" || status === "ARCHIVED") && !canApproveArticles(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Article publish/archive permission is required.");
  }
}

export function assertCaseStudyStatusAllowed(actor: Principal, status: string) {
  if (["APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"].includes(status) && !canApproveCaseStudies(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Case study approval permission is required.");
  }
}

export function assertSocialDraftStatusAllowed(actor: Principal, status: string) {
  if (["APPROVED", "SCHEDULED", "PUBLISHED", "REJECTED", "ARCHIVED"].includes(status) && !canApproveSocialDrafts(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Social draft approval permission is required.");
  }
}

function parseOptionalDate(value: string | undefined | null, field: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} is invalid.`);
  }

  return parsed;
}

function publishedAtFor(status: string, value: string | undefined | null) {
  if (status === "PUBLISHED") {
    return parseOptionalDate(value, "publishedAt") ?? new Date();
  }

  return parseOptionalDate(value, "publishedAt");
}

export function normalizeSocialDraftScheduledAt(status: string, value: string | undefined | null) {
  const scheduledAt = parseOptionalDate(value, "scheduledAt");
  if (status === "SCHEDULED" && !scheduledAt) {
    throw new ApiError(400, "VALIDATION_ERROR", "scheduledAt is required for scheduled social drafts.");
  }
  if (scheduledAt && !["SCHEDULED", "PUBLISHED"].includes(status)) {
    throw new ApiError(400, "VALIDATION_ERROR", "scheduledAt can be set only for scheduled or published social drafts.");
  }

  return scheduledAt;
}

export function assertCaseStudyIsPublicSafe(input: {
  isAnonymized: boolean;
  status: string;
  title: string;
  challenge: string;
  approach: string;
  generalOutcome: string;
  lessons: string;
}) {
  if (!["APPROVED", "PUBLISHED"].includes(input.status)) {
    return;
  }

  if (!input.isAnonymized) {
    throw new ApiError(400, "VALIDATION_ERROR", "Approved or published case studies must be anonymized.");
  }

  const serialized = [input.title, input.challenge, input.approach, input.generalOutcome, input.lessons].join("\n");
  if (/KMT-\d{4}-\d+/i.test(serialized) || /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(serialized) || /\+?\d[\d\s().-]{8,}\d/.test(serialized)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Case study contains obvious private identifiers.");
  }
}

function handleUniqueSlugError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ApiError(409, "CONFLICT", "Slug already exists.");
  }

  throw error;
}

function normalizeQuery(input: unknown) {
  return parseWithSchema(adminContentHubQuerySchema, input, "Content hub query is invalid.");
}

function textSearch(search: string | undefined): Prisma.StringFilter | undefined {
  return search ? { contains: search, mode: "insensitive" } : undefined;
}

function articleWhere(filters: AdminContentHubQuery): Prisma.ArticleWhereInput {
  const search = filters.q?.trim();
  const status = filters.status && articleStatusValues.includes(filters.status as ArticleStatusValue) ? (filters.status as ArticleStatusValue) : undefined;

  return {
    AND: [
      status ? { status } : {},
      filters.category ? { category: filters.category } : {},
      search
        ? {
            OR: [{ title: textSearch(search) }, { slug: textSearch(search) }, { excerpt: textSearch(search) }, { category: textSearch(search) }]
          }
        : {}
    ]
  };
}

function caseStudyWhere(filters: AdminContentHubQuery): Prisma.CaseStudyWhereInput {
  const search = filters.q?.trim();
  const status = filters.status && caseStudyStatusValues.includes(filters.status as CaseStudyStatusValue) ? (filters.status as CaseStudyStatusValue) : undefined;

  return {
    AND: [
      status ? { status } : {},
      filters.category ? { category: filters.category } : {},
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
              { challenge: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}
    ]
  };
}

function socialWhere(filters: AdminContentHubQuery): Prisma.SocialPostDraftWhereInput {
  const search = filters.q?.trim();
  const status = filters.status && socialDraftStatusValues.includes(filters.status as SocialDraftStatusValue) ? (filters.status as SocialDraftStatusValue) : undefined;

  return {
    AND: [
      status ? { status } : {},
      filters.platform ? { platform: filters.platform } : {},
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
              { platform: { contains: search, mode: "insensitive" } },
              { sourceType: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}
    ]
  };
}

function orderByFor(filters: AdminContentHubQuery) {
  return [{ [filters.sortBy]: filters.sortDirection }, { updatedAt: "desc" }] as Array<Record<string, "asc" | "desc">>;
}

async function listPendingRows(filters: AdminContentHubQuery) {
  const search = filters.q?.trim()?.toLowerCase();
  const [articles, caseStudies, socialDrafts] = await Promise.all([
    prisma.article.findMany({
      where: { status: "REVIEW" },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 120
    }),
    prisma.caseStudy.findMany({
      where: { status: "LEGAL_REVIEW" },
      include: { approvedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 120
    }),
    prisma.socialPostDraft.findMany({
      where: { status: "LEGAL_REVIEW" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 120
    })
  ]);

  const rows: PendingRow[] = [
    ...articles.map((item) => ({
      id: item.id,
      type: "article" as const,
      title: item.title,
      status: item.status,
      category: item.category,
      platform: null,
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
      href: `/admin/content?tab=articles&editType=article&editId=${item.id}`
    })),
    ...caseStudies.map((item) => ({
      id: item.id,
      type: "caseStudy" as const,
      title: item.title,
      status: item.status,
      category: item.category,
      platform: null,
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
      href: `/admin/content?tab=case-studies&editType=caseStudy&editId=${item.id}`
    })),
    ...socialDrafts.map((item) => ({
      id: item.id,
      type: "social" as const,
      title: item.title,
      status: item.status,
      category: item.sourceType,
      platform: item.platform,
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
      href: `/admin/content?tab=social&editType=social&editId=${item.id}`
    }))
  ].filter((row) => {
    if (!search) {
      return true;
    }
    return [row.title, row.status, row.category, row.platform].filter(Boolean).join(" ").toLowerCase().includes(search);
  });

  rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return rows;
}

export async function getAdminContentHub(input: { actor: Principal; query: unknown }) {
  assertContentAccess(input.actor);
  const filters = normalizeQuery(input.query);
  const pagination = toPagination(filters);

  const [summary, articlesCategories, caseStudyCategories] = await Promise.all([
    getContentSummary(input.actor),
    prisma.article.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" }, take: 100 }),
    prisma.caseStudy.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" }, take: 100 })
  ]);

  if (filters.tab === "pending") {
    const pendingRows = await listPendingRows(filters);
    return {
      tab: filters.tab,
      filters,
      summary,
      categories: [...new Set([...articlesCategories.map((item) => item.category), ...caseStudyCategories.map((item) => item.category)])],
      articles: [],
      caseStudies: [],
      socialDrafts: [],
      pendingRows: pendingRows.slice(pagination.skip, pagination.skip + pagination.take),
      total: pendingRows.length,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }

  if (filters.tab === "case-studies") {
    const where = caseStudyWhere(filters);
    const [items, total] = await Promise.all([
      prisma.caseStudy.findMany({
        where,
        include: { approvedBy: { select: { id: true, name: true, email: true } } },
        orderBy: orderByFor(filters) as Prisma.CaseStudyOrderByWithRelationInput[],
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.caseStudy.count({ where })
    ]);

    return {
      tab: filters.tab,
      filters,
      summary,
      categories: caseStudyCategories.map((item) => item.category),
      articles: [],
      caseStudies: items,
      socialDrafts: [],
      pendingRows: [],
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }

  if (filters.tab === "social") {
    const where = socialWhere(filters);
    const [items, total] = await Promise.all([
      prisma.socialPostDraft.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } }
        },
        orderBy: orderByFor(filters) as Prisma.SocialPostDraftOrderByWithRelationInput[],
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.socialPostDraft.count({ where })
    ]);

    return {
      tab: filters.tab,
      filters,
      summary,
      categories: [],
      articles: [],
      caseStudies: [],
      socialDrafts: items,
      pendingRows: [],
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }

  const where = articleWhere(filters);
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: orderByFor(filters) as Prisma.ArticleOrderByWithRelationInput[],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.article.count({ where })
  ]);

  return {
    tab: filters.tab,
    filters,
    summary,
    categories: articlesCategories.map((item) => item.category),
    articles: items,
    caseStudies: [],
    socialDrafts: [],
    pendingRows: [],
    total,
    page: pagination.page,
    pageSize: pagination.pageSize
  };
}

export async function getContentSummary(actor: Principal) {
  assertContentAccess(actor);
  const [articles, caseStudies, socialDrafts, pendingArticles, pendingCaseStudies, pendingSocialDrafts, scheduledSocialDrafts] =
    await Promise.all([
      prisma.article.count(),
      prisma.caseStudy.count(),
      prisma.socialPostDraft.count(),
      prisma.article.count({ where: { status: "REVIEW" } }),
      prisma.caseStudy.count({ where: { status: "LEGAL_REVIEW" } }),
      prisma.socialPostDraft.count({ where: { status: "LEGAL_REVIEW" } }),
      prisma.socialPostDraft.count({ where: { status: "SCHEDULED" } })
    ]);

  return {
    articles,
    caseStudies,
    socialDrafts,
    pendingApproval: pendingArticles + pendingCaseStudies + pendingSocialDrafts,
    scheduledSocialDrafts,
    mediaEntries: socialDrafts
  };
}

export async function getAdminArticleDetail(input: { actor: Principal; articleId: string }) {
  assertContentAccess(input.actor);
  const articleId = parseWithSchema(uuidSchema, input.articleId, "Article id is invalid.");
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: { select: { id: true, name: true, email: true } } }
  });
  if (!article) {
    throw new ApiError(404, "NOT_FOUND", "Article was not found.");
  }
  return article;
}

export async function getAdminCaseStudyDetail(input: { actor: Principal; caseStudyId: string }) {
  assertContentAccess(input.actor);
  const caseStudyId = parseWithSchema(uuidSchema, input.caseStudyId, "Case study id is invalid.");
  const study = await prisma.caseStudy.findUnique({
    where: { id: caseStudyId },
    include: { approvedBy: { select: { id: true, name: true, email: true } } }
  });
  if (!study) {
    throw new ApiError(404, "NOT_FOUND", "Case study was not found.");
  }
  return study;
}

export async function getAdminSocialDraftDetail(input: { actor: Principal; draftId: string }) {
  assertContentAccess(input.actor);
  const draftId = parseWithSchema(uuidSchema, input.draftId, "Social draft id is invalid.");
  const draft = await prisma.socialPostDraft.findUnique({
    where: { id: draftId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } }
    }
  });
  if (!draft) {
    throw new ApiError(404, "NOT_FOUND", "Social draft was not found.");
  }
  return draft;
}

function articleData(actor: Principal, body: AdminArticleWriteInput) {
  assertArticleStatusAllowed(actor, body.status);
  return {
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt,
    content: body.content,
    category: body.category,
    status: body.status,
    publishedAt: publishedAtFor(body.status, body.publishedAt)
  };
}

function caseStudyData(actor: Principal, body: z.infer<typeof adminCaseStudyWriteSchema>) {
  assertCaseStudyStatusAllowed(actor, body.status);
  assertCaseStudyIsPublicSafe(body);
  return {
    title: body.title,
    slug: body.slug,
    category: body.category,
    challenge: body.challenge,
    approach: body.approach,
    generalOutcome: body.generalOutcome,
    lessons: body.lessons,
    status: body.status,
    isAnonymized: body.isAnonymized,
    publishedAt: publishedAtFor(body.status, body.publishedAt),
    approvedById: ["APPROVED", "PUBLISHED", "REJECTED"].includes(body.status) ? actor.id : null
  };
}

function socialDraftData(actor: Principal, body: AdminSocialDraftWriteInput) {
  assertSocialDraftStatusAllowed(actor, body.status);
  return {
    title: body.title,
    platform: body.platform,
    content: body.content,
    sourceType: body.sourceType || null,
    sourceId: body.sourceId || null,
    status: body.status,
    scheduledAt: normalizeSocialDraftScheduledAt(body.status, body.scheduledAt),
    approvedById: ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(body.status) ? actor.id : null
  };
}

export async function createAdminArticle(input: { actor: Principal; body: unknown; request?: Request }) {
  assertCreateArticle(input.actor);
  const body = parseWithSchema(adminArticleWriteSchema, input.body, "Article payload is invalid.");

  try {
    const article = await prisma.article.create({
      data: { ...articleData(input.actor, body), authorId: input.actor.id },
      include: { author: { select: { id: true, name: true, email: true } } }
    });

    await appendAuditLog({
      actorId: input.actor.id,
      action: "content.article_create",
      resourceType: "Article",
      resourceId: article.id,
      metadata: { status: article.status, slug: article.slug, category: article.category },
      request: input.request
    });

    return article;
  } catch (error) {
    handleUniqueSlugError(error);
  }
}

export async function updateAdminArticle(input: { actor: Principal; articleId: string; body: unknown; request?: Request }) {
  assertCreateArticle(input.actor);
  const articleId = parseWithSchema(uuidSchema, input.articleId, "Article id is invalid.");
  const body = parseWithSchema(adminArticleWriteSchema, input.body, "Article payload is invalid.");
  const existing = await prisma.article.findUnique({ where: { id: articleId }, select: { id: true, status: true, slug: true } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Article was not found.");
  }

  try {
    const article = await prisma.article.update({
      where: { id: articleId },
      data: articleData(input.actor, body),
      include: { author: { select: { id: true, name: true, email: true } } }
    });

    await appendAuditLog({
      actorId: input.actor.id,
      action: "content.article_update",
      resourceType: "Article",
      resourceId: article.id,
      metadata: { previousStatus: existing.status, status: article.status, previousSlug: existing.slug, slug: article.slug },
      request: input.request
    });

    return article;
  } catch (error) {
    handleUniqueSlugError(error);
  }
}

export async function createAdminCaseStudy(input: { actor: Principal; body: unknown; request?: Request }) {
  assertCreateCaseStudy(input.actor);
  const body = parseWithSchema(adminCaseStudyWriteSchema, input.body, "Case study payload is invalid.");

  try {
    const study = await prisma.caseStudy.create({
      data: caseStudyData(input.actor, body),
      include: { approvedBy: { select: { id: true, name: true, email: true } } }
    });

    await appendAuditLog({
      actorId: input.actor.id,
      action: "content.case_study_create",
      resourceType: "CaseStudy",
      resourceId: study.id,
      metadata: { status: study.status, slug: study.slug, isAnonymized: study.isAnonymized },
      request: input.request
    });

    return study;
  } catch (error) {
    handleUniqueSlugError(error);
  }
}

export async function updateAdminCaseStudy(input: { actor: Principal; caseStudyId: string; body: unknown; request?: Request }) {
  assertCreateCaseStudy(input.actor);
  const caseStudyId = parseWithSchema(uuidSchema, input.caseStudyId, "Case study id is invalid.");
  const body = parseWithSchema(adminCaseStudyWriteSchema, input.body, "Case study payload is invalid.");
  const existing = await prisma.caseStudy.findUnique({ where: { id: caseStudyId }, select: { id: true, status: true, slug: true } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Case study was not found.");
  }

  try {
    const study = await prisma.caseStudy.update({
      where: { id: caseStudyId },
      data: caseStudyData(input.actor, body),
      include: { approvedBy: { select: { id: true, name: true, email: true } } }
    });

    await appendAuditLog({
      actorId: input.actor.id,
      action: "content.case_study_update",
      resourceType: "CaseStudy",
      resourceId: study.id,
      metadata: { previousStatus: existing.status, status: study.status, previousSlug: existing.slug, slug: study.slug },
      request: input.request
    });

    return study;
  } catch (error) {
    handleUniqueSlugError(error);
  }
}

export async function createAdminSocialDraft(input: { actor: Principal; body: unknown; request?: Request }) {
  assertCreateSocialDraft(input.actor);
  const body = parseWithSchema(adminSocialDraftWriteSchema, input.body, "Social draft payload is invalid.");

  const draft = await prisma.socialPostDraft.create({
    data: { ...socialDraftData(input.actor, body), createdById: input.actor.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } }
    }
  });

  await appendAuditLog({
    actorId: input.actor.id,
    action: "content.social_draft_create",
    resourceType: "SocialPostDraft",
    resourceId: draft.id,
    metadata: { status: draft.status, platform: draft.platform, sourceType: draft.sourceType },
    request: input.request
  });

  return draft;
}

export async function updateAdminSocialDraft(input: { actor: Principal; draftId: string; body: unknown; request?: Request }) {
  assertCreateSocialDraft(input.actor);
  const draftId = parseWithSchema(uuidSchema, input.draftId, "Social draft id is invalid.");
  const body = parseWithSchema(adminSocialDraftWriteSchema, input.body, "Social draft payload is invalid.");
  const existing = await prisma.socialPostDraft.findUnique({ where: { id: draftId }, select: { id: true, status: true } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Social draft was not found.");
  }

  const draft = await prisma.socialPostDraft.update({
    where: { id: draftId },
    data: socialDraftData(input.actor, body),
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } }
    }
  });

  await appendAuditLog({
    actorId: input.actor.id,
    action: "content.social_draft_update",
    resourceType: "SocialPostDraft",
    resourceId: draft.id,
    metadata: { previousStatus: existing.status, status: draft.status, platform: draft.platform },
    request: input.request
  });

  return draft;
}

export async function createAiSocialDraft(input: { actor: Principal; body: unknown; request?: Request }) {
  assertCreateSocialDraft(input.actor);
  const body = parseWithSchema(adminSocialAiDraftSchema, input.body, "AI social draft payload is invalid.");

  const result = await generateStructured({
    task: "social_post_draft",
    locale: body.locale,
    input: {
      platform: body.platform,
      sourceType: body.sourceType || "manual",
      sourceText: body.sourceText
    },
    schema: socialPostDraftOutputSchema,
    actorId: input.actor.id
  });

  const generated = result.output;
  const content = [
    generated.content,
    generated.hashtags.length ? generated.hashtags.join(" ") : "",
    "",
    AI_REVIEW_DISCLAIMER[body.locale],
    generated.reviewNote
  ]
    .filter(Boolean)
    .join("\n");

  const draft = await prisma.socialPostDraft.create({
    data: {
      title: body.title,
      platform: body.platform,
      content,
      sourceType: body.sourceType || "ai",
      sourceId: body.sourceId || result.requestId,
      status: "LEGAL_REVIEW",
      createdById: input.actor.id
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } }
    }
  });

  await appendAuditLog({
    actorId: input.actor.id,
    action: "content.social_draft_ai_create",
    resourceType: "SocialPostDraft",
    resourceId: draft.id,
    metadata: {
      provider: result.provider,
      model: result.model,
      requestId: result.requestId,
      reviewRequired: result.reviewRequired,
      platform: draft.platform
    },
    request: input.request
  });

  return { draft, ai: { provider: result.provider, model: result.model, requestId: result.requestId, reviewRequired: result.reviewRequired } };
}
