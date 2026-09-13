import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PATCH as patchArticle } from "@/app/api/admin/content/articles/[articleId]/route";
import { PATCH as patchCaseStudy } from "@/app/api/admin/content/case-studies/[caseStudyId]/route";
import { PATCH as patchSocialDraft } from "@/app/api/admin/content/social-drafts/[draftId]/route";
import { SESSION_COOKIE_NAME, createSessionToken, hashSessionToken } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

const enabled = process.env.RUN_BATCH14_POSTGRES === "true";
const describePostgres = enabled && process.env.DATABASE_URL ? describe : describe.skip;
const ids = { creator: randomUUID(), approver: randomUUID() };
const marker = "batch14-synthetic-content-lifecycle";
let creatorRoleId = "";
let approverRoleId = "";
let creatorCookie = "";
let approverCookie = "";

async function sessionCookie(userId: string) {
  const token = createSessionToken();
  await prisma.session.create({ data: { userId, tokenHash: hashSessionToken(token), status: "ACTIVE", expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;
}

function request(path: string, cookie: string | null, body: Record<string, unknown>) {
  return new Request(`http://127.0.0.1:3115${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
}

async function reset() {
  await prisma.auditLog.deleteMany({ where: { actorId: { in: Object.values(ids) } } });
  await prisma.article.deleteMany({ where: { authorId: { in: Object.values(ids) } } });
  await prisma.caseStudy.deleteMany({ where: { approvedById: { in: Object.values(ids) } } });
  await prisma.socialPostDraft.deleteMany({ where: { createdById: { in: Object.values(ids) } } });
}

describePostgres.sequential("batch14 protected content lifecycle baseline", () => {
  beforeAll(async () => {
    const permissions = ["content.create.any", "content.approve.any", "caseStudy.create.any", "caseStudy.approve.any", "socialDraft.create.any", "socialDraft.approve.any"];
    const [creatorRole, approverRole] = await Promise.all([
      prisma.role.create({ data: { name: `${marker}-creator`, status: "ACTIVE" } }),
      prisma.role.create({ data: { name: `${marker}-approver`, status: "ACTIVE" } })
    ]);
    creatorRoleId = creatorRole.id;
    approverRoleId = approverRole.id;
    for (const key of permissions) {
      const permission = await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
      if (key.endsWith("create.any")) await prisma.rolePermission.create({ data: { roleId: creatorRoleId, permissionId: permission.id } });
      await prisma.rolePermission.create({ data: { roleId: approverRoleId, permissionId: permission.id } });
    }
    await prisma.user.createMany({ data: [
      { id: ids.creator, name: `${marker} creator`, email: `${ids.creator}@example.test`, roleId: creatorRoleId, status: "ACTIVE" },
      { id: ids.approver, name: `${marker} approver`, email: `${ids.approver}@example.test`, roleId: approverRoleId, status: "ACTIVE" }
    ] });
    [creatorCookie, approverCookie] = await Promise.all([sessionCookie(ids.creator), sessionCookie(ids.approver)]);
  });

  beforeEach(reset);
  afterAll(async () => {
    await reset();
    await prisma.session.deleteMany({ where: { userId: { in: Object.values(ids) } } });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
    await prisma.role.deleteMany({ where: { id: { in: [creatorRoleId, approverRoleId] } } });
    await prisma.$disconnect();
  });

  it("requires approval to withdraw published articles and case studies, and scheduled social drafts", async () => {
    const [article, study, draft] = await Promise.all([
      prisma.article.create({ data: { title: "Published article", slug: `article-${randomUUID()}`, locale: "en", excerpt: "Safe public article excerpt with enough detail", content: "Safe public article content with enough detail for the validated content contract.", category: "Contracts", status: "PUBLISHED", publishedAt: new Date(), authorId: ids.approver } }),
      prisma.caseStudy.create({ data: { title: "Published study", slug: `study-${randomUUID()}`, locale: "en", category: "Contracts", challenge: "Safe general challenge", approach: "Safe general approach", generalOutcome: "Safe general outcome", lessons: "Safe general lessons", status: "PUBLISHED", isAnonymized: true, publishedAt: new Date(), approvedById: ids.approver } }),
      prisma.socialPostDraft.create({ data: { title: "Scheduled draft", platform: "linkedin", content: "Safe scheduled draft", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 3600000), createdById: ids.approver, approvedById: ids.approver } })
    ]);
    const articleResponse = await patchArticle(request(`/api/admin/content/articles/${article.id}`, creatorCookie, { title: "Creator overwrite", slug: article.slug, locale: "en", excerpt: article.excerpt, content: article.content, category: article.category, status: "DRAFT", publishedAt: "" }), { params: Promise.resolve({ articleId: article.id }) });
    const studyResponse = await patchCaseStudy(request(`/api/admin/content/case-studies/${study.id}`, creatorCookie, { title: "Creator overwrite", slug: study.slug, locale: "en", category: study.category, challenge: study.challenge, approach: study.approach, generalOutcome: study.generalOutcome, lessons: study.lessons, isAnonymized: true, status: "DRAFT", publishedAt: "" }), { params: Promise.resolve({ caseStudyId: study.id }) });
    const socialResponse = await patchSocialDraft(request(`/api/admin/content/social-drafts/${draft.id}`, creatorCookie, { title: "Creator overwrite", platform: draft.platform, content: draft.content, sourceType: "", sourceId: "", status: "DRAFT", scheduledAt: "" }), { params: Promise.resolve({ draftId: draft.id }) });
    expect([articleResponse.status, studyResponse.status, socialResponse.status]).toEqual([403, 403, 403]);
    expect(await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).toMatchObject({ title: "Published article", status: "PUBLISHED" });
    expect(await prisma.caseStudy.findUniqueOrThrow({ where: { id: study.id } })).toMatchObject({ title: "Published study", status: "PUBLISHED", approvedById: ids.approver });
    expect(await prisma.socialPostDraft.findUniqueOrThrow({ where: { id: draft.id } })).toMatchObject({ title: "Scheduled draft", status: "SCHEDULED", approvedById: ids.approver });
    expect(await prisma.auditLog.count({ where: { actorId: ids.creator, action: { in: ["content.article_update", "content.case_study_update", "content.social_draft_update"] } } })).toBe(0);
  });

  it("preserves guest denial, creator draft edits, rejected or archived rework, and approver updates", async () => {
    const article = await prisma.article.create({ data: { title: "Draft article", slug: `draft-${randomUUID()}`, locale: "en", excerpt: "A sufficiently descriptive draft excerpt", content: "A sufficiently descriptive draft article body for the validated content contract.", category: "Contracts", status: "DRAFT", authorId: ids.creator } });
    const denied = await patchArticle(request(`/api/admin/content/articles/${article.id}`, null, { title: article.title, slug: article.slug, locale: "en", excerpt: article.excerpt, content: article.content, category: article.category, status: "DRAFT", publishedAt: "" }), { params: Promise.resolve({ articleId: article.id }) });
    const creator = await patchArticle(request(`/api/admin/content/articles/${article.id}`, creatorCookie, { title: "Creator draft edit", slug: article.slug, locale: "en", excerpt: article.excerpt, content: article.content, category: article.category, status: "REVIEW", publishedAt: "" }), { params: Promise.resolve({ articleId: article.id }) });
    const approved = await patchArticle(request(`/api/admin/content/articles/${article.id}`, approverCookie, { title: "Approver publication", slug: article.slug, locale: "en", excerpt: article.excerpt, content: article.content, category: article.category, status: "PUBLISHED", publishedAt: "2026-09-13" }), { params: Promise.resolve({ articleId: article.id }) });
    expect([denied.status, creator.status, approved.status]).toEqual([401, 200, 200]);
    expect(await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).toMatchObject({ title: "Approver publication", status: "PUBLISHED" });
  });
});
