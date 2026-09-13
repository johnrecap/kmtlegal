import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PATCH as patchArticle } from "@/app/api/admin/content/articles/[articleId]/route";
import { PATCH as patchCaseStudy } from "@/app/api/admin/content/case-studies/[caseStudyId]/route";
import { PATCH as patchSocialDraft } from "@/app/api/admin/content/social-drafts/[draftId]/route";
import { SESSION_COOKIE_NAME, createSessionToken, hashSessionToken } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

const enabled = process.env.RUN_BATCH14_POSTGRES === "true";
const describePostgres = enabled && process.env.DATABASE_URL ? describe : describe.skip;
const expectedDataDirectory = "C:/Users/SOUQ/.codex/worktrees/a701/kmt legal office/_workspace/batch10-postgres/data";
const ids = {
  creator: randomUUID(),
  approver: randomUUID(),
  secondApprover: randomUUID(),
  wrongApprover: randomUUID(),
  approvalOnly: randomUUID()
};
const marker = "batch14-synthetic-content-lifecycle";
const fixtureIds = { articles: new Set<string>(), studies: new Set<string>(), drafts: new Set<string>() };
let creatorRoleId = "";
let approverRoleId = "";
let wrongApproverRoleId = "";
let approvalOnlyRoleId = "";
let creatorCookie = "";
let approverCookie = "";
let secondApproverCookie = "";
let wrongApproverCookie = "";
let approvalOnlyCookie = "";

async function sessionCookie(userId: string) {
  const token = createSessionToken();
  await prisma.session.create({ data: { userId, tokenHash: hashSessionToken(token), status: "ACTIVE", expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;
}

function request(path: string, cookie: string | null, body: Record<string, unknown>) {
  return new Request(`http://127.0.0.1:3115${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
}

function articlePayload(article: { title: string; slug: string; excerpt: string; content: string; category: string }, status = "DRAFT") {
  return { title: article.title, slug: article.slug, locale: "en", excerpt: article.excerpt, content: article.content, category: article.category, status, publishedAt: status === "PUBLISHED" ? "2026-09-13" : "" };
}

async function reset() {
  await prisma.auditLog.deleteMany({ where: { actorId: { in: Object.values(ids) } } });
  await prisma.article.deleteMany({ where: { id: { in: [...fixtureIds.articles] } } });
  await prisma.caseStudy.deleteMany({ where: { id: { in: [...fixtureIds.studies] } } });
  await prisma.socialPostDraft.deleteMany({ where: { id: { in: [...fixtureIds.drafts] } } });
}

async function assertSyntheticEnvironment() {
  if (process.env.APP_ENV !== "local") throw new Error("Batch14 requires APP_ENV=local.");
  const parsed = new URL(process.env.DATABASE_URL!);
  if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55441" || parsed.pathname !== "/kmt_batch10" || parsed.username !== "kmt_batch10") throw new Error("Batch14 requires the authorized isolated database identity.");
  const rows = await prisma.$queryRaw<Array<{ database: string; username: string; port: number; dataDirectory: string }>>`SELECT current_database() AS database, current_user AS username, inet_server_port() AS port, current_setting('data_directory') AS "dataDirectory"`;
  if (rows[0]?.database !== "kmt_batch10" || rows[0]?.username !== "kmt_batch10" || rows[0]?.port !== 55441 || rows[0]?.dataDirectory.replaceAll("\\", "/") !== expectedDataDirectory) throw new Error("Batch14 database identity verification failed.");
  const markerRow = await prisma.$queryRaw<Array<{ marker: string }>>`SELECT marker FROM batch10_marker WHERE marker = 'synthetic-batch10-only'`;
  if (markerRow[0]?.marker !== "synthetic-batch10-only") throw new Error("Batch14 marker missing.");
}

async function waitForRowLock(blockerPid: number, operation: Promise<unknown>, excludedPids: readonly number[] = []) {
  let settled = false;
  void operation.then(
    () => { settled = true; },
    () => { settled = true; }
  );
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (settled) throw new Error("The protected operation settled before PostgreSQL reported its lock wait.");
    const rows = await prisma.$queryRaw<Array<{ pid: number }>>(Prisma.sql`
      WITH RECURSIVE blocked(pid) AS (
        SELECT activity.pid
        FROM pg_stat_activity activity
        WHERE activity.datname = current_database()
          AND activity.pid <> pg_backend_pid()
          AND ${blockerPid} = ANY(pg_blocking_pids(activity.pid))
          AND activity.wait_event_type = 'Lock'
        UNION
        SELECT activity.pid
        FROM pg_stat_activity activity
        JOIN blocked ON blocked.pid = ANY(pg_blocking_pids(activity.pid))
        WHERE activity.datname = current_database()
          AND activity.wait_event_type = 'Lock'
      )
      SELECT pid FROM blocked
    `);
    const witness = rows.find(({ pid }) => !excludedPids.includes(pid));
    if (witness) return witness.pid;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("PostgreSQL did not expose the expected row-lock wait within five seconds.");
}

describePostgres.sequential("batch14 protected content lifecycle baseline", () => {
  beforeAll(async () => {
    await assertSyntheticEnvironment();
    const permissions = ["content.create.any", "content.approve.any", "caseStudy.create.any", "caseStudy.approve.any", "socialDraft.create.any", "socialDraft.approve.any"];
    const [creatorRole, approverRole, wrongApproverRole, approvalOnlyRole] = await Promise.all([
      prisma.role.create({ data: { name: `${marker}-creator`, status: "ACTIVE" } }),
      prisma.role.create({ data: { name: `${marker}-approver`, status: "ACTIVE" } }),
      prisma.role.create({ data: { name: `${marker}-wrong-approver`, status: "ACTIVE" } }),
      prisma.role.create({ data: { name: `${marker}-approval-only`, status: "ACTIVE" } })
    ]);
    creatorRoleId = creatorRole.id;
    approverRoleId = approverRole.id;
    wrongApproverRoleId = wrongApproverRole.id;
    approvalOnlyRoleId = approvalOnlyRole.id;
    for (const key of permissions) {
      const permission = await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
      if (key.endsWith("create.any")) await prisma.rolePermission.create({ data: { roleId: creatorRoleId, permissionId: permission.id } });
      await prisma.rolePermission.create({ data: { roleId: approverRoleId, permissionId: permission.id } });
      if (key === "content.create.any" || key === "caseStudy.approve.any") {
        await prisma.rolePermission.create({ data: { roleId: wrongApproverRoleId, permissionId: permission.id } });
      }
      if (key === "content.approve.any") {
        await prisma.rolePermission.create({ data: { roleId: approvalOnlyRoleId, permissionId: permission.id } });
      }
    }
    await prisma.user.createMany({ data: [
      { id: ids.creator, name: `${marker} creator`, email: `${ids.creator}@example.test`, roleId: creatorRoleId, status: "ACTIVE" },
      { id: ids.approver, name: `${marker} approver`, email: `${ids.approver}@example.test`, roleId: approverRoleId, status: "ACTIVE" },
      { id: ids.secondApprover, name: `${marker} second approver`, email: `${ids.secondApprover}@example.test`, roleId: approverRoleId, status: "ACTIVE" },
      { id: ids.wrongApprover, name: `${marker} wrong approver`, email: `${ids.wrongApprover}@example.test`, roleId: wrongApproverRoleId, status: "ACTIVE" },
      { id: ids.approvalOnly, name: `${marker} approval only`, email: `${ids.approvalOnly}@example.test`, roleId: approvalOnlyRoleId, status: "ACTIVE" }
    ] });
    [creatorCookie, approverCookie, secondApproverCookie, wrongApproverCookie, approvalOnlyCookie] = await Promise.all([
      sessionCookie(ids.creator),
      sessionCookie(ids.approver),
      sessionCookie(ids.secondApprover),
      sessionCookie(ids.wrongApprover),
      sessionCookie(ids.approvalOnly)
    ]);
  });

  beforeEach(reset);
  afterAll(async () => {
    await assertSyntheticEnvironment();
    await reset();
    await prisma.session.deleteMany({ where: { userId: { in: Object.values(ids) } } });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
    await prisma.role.deleteMany({ where: { id: { in: [creatorRoleId, approverRoleId, wrongApproverRoleId, approvalOnlyRoleId] } } });
    expect(await prisma.article.count({ where: { id: { in: [...fixtureIds.articles] } } })).toBe(0);
    expect(await prisma.caseStudy.count({ where: { id: { in: [...fixtureIds.studies] } } })).toBe(0);
    expect(await prisma.socialPostDraft.count({ where: { id: { in: [...fixtureIds.drafts] } } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { actorId: { in: Object.values(ids) } } })).toBe(0);
    expect(await prisma.session.count({ where: { userId: { in: Object.values(ids) } } })).toBe(0);
    expect(await prisma.user.count({ where: { id: { in: Object.values(ids) } } })).toBe(0);
    expect(await prisma.role.count({ where: { id: { in: [creatorRoleId, approverRoleId, wrongApproverRoleId, approvalOnlyRoleId] } } })).toBe(0);
    await prisma.$disconnect();
  });

  it("requires approval for every protected source state across all content types", async () => {
    const articleId = randomUUID(); const studyId = randomUUID(); const approvedStudyId = randomUUID();
    const draftId = randomUUID(); const approvedDraftId = randomUUID(); const publishedDraftId = randomUUID();
    fixtureIds.articles.add(articleId);
    fixtureIds.studies.add(studyId); fixtureIds.studies.add(approvedStudyId);
    fixtureIds.drafts.add(draftId); fixtureIds.drafts.add(approvedDraftId); fixtureIds.drafts.add(publishedDraftId);
    const [article, study, approvedStudy, draft, approvedDraft, publishedDraft] = await Promise.all([
      prisma.article.create({ data: { id: articleId, title: "Published article", slug: `article-${randomUUID()}`, locale: "en", excerpt: "Safe public article excerpt with enough detail", content: "Safe public article content with enough detail for the validated content contract.", category: "Contracts", status: "PUBLISHED", publishedAt: new Date(), authorId: ids.approver } }),
      prisma.caseStudy.create({ data: { id: studyId, title: "Published study", slug: `study-${randomUUID()}`, locale: "en", category: "Contracts", challenge: "Safe general challenge", approach: "Safe general approach", generalOutcome: "Safe general outcome", lessons: "Safe general lessons", status: "PUBLISHED", isAnonymized: true, publishedAt: new Date(), approvedById: ids.approver } }),
      prisma.caseStudy.create({ data: { id: approvedStudyId, title: "Approved study", slug: `approved-${randomUUID()}`, locale: "en", category: "Contracts", challenge: "Safe approved challenge", approach: "Safe approved approach", generalOutcome: "Safe approved outcome", lessons: "Safe approved lessons", status: "APPROVED", isAnonymized: true, approvedById: ids.approver } }),
      prisma.socialPostDraft.create({ data: { id: draftId, title: "Scheduled draft", platform: "linkedin", content: "Safe scheduled draft", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 3600000), createdById: ids.approver, approvedById: ids.approver } }),
      prisma.socialPostDraft.create({ data: { id: approvedDraftId, title: "Approved social", platform: "linkedin", content: "Safe approved social draft", status: "APPROVED", createdById: ids.approver, approvedById: ids.approver } }),
      prisma.socialPostDraft.create({ data: { id: publishedDraftId, title: "Published social", platform: "linkedin", content: "Safe published social draft", status: "PUBLISHED", createdById: ids.approver, approvedById: ids.approver } })
    ]);
    const articleResponse = await patchArticle(request(`/api/admin/content/articles/${article.id}`, creatorCookie, { title: "Creator overwrite", slug: article.slug, locale: "en", excerpt: article.excerpt, content: article.content, category: article.category, status: "DRAFT", publishedAt: "" }), { params: Promise.resolve({ articleId: article.id }) });
    const studyResponse = await patchCaseStudy(request(`/api/admin/content/case-studies/${study.id}`, creatorCookie, { title: "Creator overwrite", slug: study.slug, locale: "en", category: study.category, challenge: study.challenge, approach: study.approach, generalOutcome: study.generalOutcome, lessons: study.lessons, isAnonymized: true, status: "DRAFT", publishedAt: "" }), { params: Promise.resolve({ caseStudyId: study.id }) });
    const approvedStudyResponse = await patchCaseStudy(request(`/api/admin/content/case-studies/${approvedStudy.id}`, creatorCookie, { title: "Creator overwrite", slug: approvedStudy.slug, locale: "en", category: approvedStudy.category, challenge: approvedStudy.challenge, approach: approvedStudy.approach, generalOutcome: approvedStudy.generalOutcome, lessons: approvedStudy.lessons, isAnonymized: true, status: "DRAFT", publishedAt: "" }), { params: Promise.resolve({ caseStudyId: approvedStudy.id }) });
    const socialResponse = await patchSocialDraft(request(`/api/admin/content/social-drafts/${draft.id}`, creatorCookie, { title: "Creator overwrite", platform: draft.platform, content: draft.content, sourceType: "", sourceId: "", status: "DRAFT", scheduledAt: "" }), { params: Promise.resolve({ draftId: draft.id }) });
    const approvedSocialResponse = await patchSocialDraft(request(`/api/admin/content/social-drafts/${approvedDraft.id}`, creatorCookie, { title: "Creator overwrite", platform: approvedDraft.platform, content: approvedDraft.content, sourceType: "", sourceId: "", status: "DRAFT", scheduledAt: "" }), { params: Promise.resolve({ draftId: approvedDraft.id }) });
    const publishedSocialResponse = await patchSocialDraft(request(`/api/admin/content/social-drafts/${publishedDraft.id}`, creatorCookie, { title: "Creator overwrite", platform: publishedDraft.platform, content: publishedDraft.content, sourceType: "", sourceId: "", status: "DRAFT", scheduledAt: "" }), { params: Promise.resolve({ draftId: publishedDraft.id }) });
    expect([articleResponse.status, studyResponse.status, approvedStudyResponse.status, socialResponse.status, approvedSocialResponse.status, publishedSocialResponse.status]).toEqual([403, 403, 403, 403, 403, 403]);
    expect(await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).toMatchObject({ title: "Published article", status: "PUBLISHED" });
    expect(await prisma.caseStudy.findUniqueOrThrow({ where: { id: study.id } })).toMatchObject({ title: "Published study", status: "PUBLISHED", approvedById: ids.approver });
    expect(await prisma.caseStudy.findUniqueOrThrow({ where: { id: approvedStudy.id } })).toMatchObject({ title: "Approved study", status: "APPROVED", approvedById: ids.approver });
    expect(await prisma.socialPostDraft.findUniqueOrThrow({ where: { id: draft.id } })).toMatchObject({ title: "Scheduled draft", status: "SCHEDULED", approvedById: ids.approver });
    expect(await prisma.socialPostDraft.findUniqueOrThrow({ where: { id: approvedDraft.id } })).toMatchObject({ title: "Approved social", status: "APPROVED", approvedById: ids.approver });
    expect(await prisma.socialPostDraft.findUniqueOrThrow({ where: { id: publishedDraft.id } })).toMatchObject({ title: "Published social", status: "PUBLISHED", approvedById: ids.approver });
    expect(await prisma.auditLog.count({ where: { actorId: ids.creator, action: { in: ["content.article_update", "content.case_study_update", "content.social_draft_update"] } } })).toBe(0);
  });

  it("preserves guest denial, creator draft edits, and approver updates", async () => {
    const articleId = randomUUID(); fixtureIds.articles.add(articleId);
    const article = await prisma.article.create({ data: { id: articleId, title: "Draft article", slug: `draft-${randomUUID()}`, locale: "en", excerpt: "A sufficiently descriptive draft excerpt", content: "A sufficiently descriptive draft article body for the validated content contract.", category: "Contracts", status: "DRAFT", authorId: ids.creator } });
    const denied = await patchArticle(request(`/api/admin/content/articles/${article.id}`, null, { title: article.title, slug: article.slug, locale: "en", excerpt: article.excerpt, content: article.content, category: article.category, status: "DRAFT", publishedAt: "" }), { params: Promise.resolve({ articleId: article.id }) });
    const creator = await patchArticle(request(`/api/admin/content/articles/${article.id}`, creatorCookie, { title: "Creator draft edit", slug: article.slug, locale: "en", excerpt: article.excerpt, content: article.content, category: article.category, status: "REVIEW", publishedAt: "" }), { params: Promise.resolve({ articleId: article.id }) });
    const approved = await patchArticle(request(`/api/admin/content/articles/${article.id}`, approverCookie, { title: "Approver publication", slug: article.slug, locale: "en", excerpt: article.excerpt, content: article.content, category: article.category, status: "PUBLISHED", publishedAt: "2026-09-13" }), { params: Promise.resolve({ articleId: article.id }) });
    expect([denied.status, creator.status, approved.status]).toEqual([401, 200, 200]);
    expect(await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).toMatchObject({ title: "Approver publication", status: "PUBLISHED" });
  });

  it("requires both the matching type approval and the existing create permission", async () => {
    const matchingId = randomUUID(); const wrongTypeId = randomUUID(); const approvalOnlyId = randomUUID();
    fixtureIds.articles.add(matchingId); fixtureIds.articles.add(wrongTypeId); fixtureIds.articles.add(approvalOnlyId);
    const [matchingArticle, wrongTypeArticle, approvalOnlyArticle] = await Promise.all([
      prisma.article.create({ data: { id: matchingId, title: "Matching approval", slug: `matching-${randomUUID()}`, locale: "en", excerpt: "Matching permission excerpt with enough detail", content: "Matching permission article body with enough detail for the validated content contract.", category: "Contracts", status: "PUBLISHED", publishedAt: new Date(), authorId: ids.approver } }),
      prisma.article.create({ data: { id: wrongTypeId, title: "Wrong type approval", slug: `wrong-type-${randomUUID()}`, locale: "en", excerpt: "Wrong type permission excerpt with enough detail", content: "Wrong type permission article body with enough detail for the validated content contract.", category: "Contracts", status: "PUBLISHED", publishedAt: new Date(), authorId: ids.approver } }),
      prisma.article.create({ data: { id: approvalOnlyId, title: "Approval without create", slug: `approval-only-${randomUUID()}`, locale: "en", excerpt: "Approval-only permission excerpt with enough detail", content: "Approval-only permission article body with enough detail for the validated content contract.", category: "Contracts", status: "PUBLISHED", publishedAt: new Date(), authorId: ids.approver } })
    ]);

    const matching = await patchArticle(request(`/api/admin/content/articles/${matchingArticle.id}`, approverCookie, { ...articlePayload(matchingArticle), title: "Matching approval accepted" }), { params: Promise.resolve({ articleId: matchingArticle.id }) });
    const wrongType = await patchArticle(request(`/api/admin/content/articles/${wrongTypeArticle.id}`, wrongApproverCookie, { ...articlePayload(wrongTypeArticle), title: "Wrong approval rejected" }), { params: Promise.resolve({ articleId: wrongTypeArticle.id }) });
    const approvalOnly = await patchArticle(request(`/api/admin/content/articles/${approvalOnlyArticle.id}`, approvalOnlyCookie, { ...articlePayload(approvalOnlyArticle), title: "Approval-only rejected" }), { params: Promise.resolve({ articleId: approvalOnlyArticle.id }) });

    expect([matching.status, wrongType.status, approvalOnly.status]).toEqual([200, 403, 403]);
    expect(await prisma.article.findUniqueOrThrow({ where: { id: matchingArticle.id } })).toMatchObject({ title: "Matching approval accepted", status: "DRAFT" });
    expect(await prisma.article.findUniqueOrThrow({ where: { id: wrongTypeArticle.id } })).toMatchObject({ title: "Wrong type approval", status: "PUBLISHED" });
    expect(await prisma.article.findUniqueOrThrow({ where: { id: approvalOnlyArticle.id } })).toMatchObject({ title: "Approval without create", status: "PUBLISHED" });
    expect(await prisma.auditLog.count({ where: { actorId: { in: [ids.wrongApprover, ids.approvalOnly] }, resourceId: { in: [wrongTypeArticle.id, approvalOnlyArticle.id] } } })).toBe(0);
  });

  it("preserves creator rework from rejected and archived source states", async () => {
    const articleId = randomUUID(); const studyId = randomUUID(); const draftId = randomUUID();
    fixtureIds.articles.add(articleId); fixtureIds.studies.add(studyId); fixtureIds.drafts.add(draftId);
    const [article, study, draft] = await Promise.all([
      prisma.article.create({ data: { id: articleId, title: "Archived article", slug: `archived-${randomUUID()}`, locale: "en", excerpt: "Archived article excerpt with enough detail", content: "Archived article body with enough detail for the validated content contract.", category: "Contracts", status: "ARCHIVED", authorId: ids.approver } }),
      prisma.caseStudy.create({ data: { id: studyId, title: "Rejected study", slug: `rejected-${randomUUID()}`, locale: "en", category: "Contracts", challenge: "A safe rejected challenge description", approach: "A safe rejected approach description", generalOutcome: "A safe rejected outcome description", lessons: "A safe rejected lessons description", status: "REJECTED", isAnonymized: true, approvedById: ids.approver } }),
      prisma.socialPostDraft.create({ data: { id: draftId, title: "Archived social", platform: "linkedin", content: "A safe archived social draft body", status: "ARCHIVED", createdById: ids.approver } })
    ]);
    const responses = await Promise.all([
      patchArticle(request(`/api/admin/content/articles/${article.id}`, creatorCookie, { ...articlePayload(article), title: "Reworked article" }), { params: Promise.resolve({ articleId: article.id }) }),
      patchCaseStudy(request(`/api/admin/content/case-studies/${study.id}`, creatorCookie, { title: "Reworked study", slug: study.slug, locale: "en", category: study.category, challenge: study.challenge, approach: study.approach, generalOutcome: study.generalOutcome, lessons: study.lessons, isAnonymized: true, status: "DRAFT", publishedAt: "" }), { params: Promise.resolve({ caseStudyId: study.id }) }),
      patchSocialDraft(request(`/api/admin/content/social-drafts/${draft.id}`, creatorCookie, { title: "Reworked social", platform: draft.platform, content: draft.content, sourceType: "", sourceId: "", status: "DRAFT", scheduledAt: "" }), { params: Promise.resolve({ draftId: draft.id }) })
    ]);
    expect(responses.map(({ status }) => status)).toEqual([200, 200, 200]);
  });

  it("denies protected targets from ordinary drafts without partial writes", async () => {
    const articleId = randomUUID(); fixtureIds.articles.add(articleId);
    const article = await prisma.article.create({ data: { id: articleId, title: "Target guard draft", slug: `target-${randomUUID()}`, locale: "en", excerpt: "Target guard excerpt with enough detail", content: "Target guard article body with enough detail for the validated content contract.", category: "Contracts", status: "DRAFT", authorId: ids.creator } });
    const response = await patchArticle(request(`/api/admin/content/articles/${article.id}`, creatorCookie, articlePayload(article, "PUBLISHED")), { params: Promise.resolve({ articleId: article.id }) });
    expect(response.status).toBe(403);
    expect(await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).toMatchObject({ status: "DRAFT", title: "Target guard draft" });
    expect(await prisma.auditLog.count({ where: { actorId: ids.creator, resourceId: article.id } })).toBe(0);
  });

  it("waits for a real row lock, observes the committed promotion, and denies the creator", async () => {
    const articleId = randomUUID(); fixtureIds.articles.add(articleId);
    const article = await prisma.article.create({ data: { id: articleId, title: "Race draft", slug: `race-${randomUUID()}`, locale: "en", excerpt: "Race article excerpt with enough detail", content: "Race article body with enough detail for the validated content contract.", category: "Contracts", status: "DRAFT", authorId: ids.creator } });
    let release: () => void = () => undefined;
    let reached: (pid: number) => void = () => undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const locked = new Promise<number>((resolve) => { reached = resolve; });
    let promotion: Promise<void> | null = null;
    let creatorRequest: Promise<Response> | null = null;
    try {
      promotion = prisma.$transaction(async (tx) => {
        const [{ pid }] = await tx.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`;
        await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "articles" WHERE "id" = ${article.id}::uuid FOR UPDATE`);
        await tx.article.update({ where: { id: article.id }, data: { status: "PUBLISHED", publishedAt: new Date(), title: "Race promoted" } });
        reached(pid);
        await gate;
      });
      const blockerPid = await Promise.race([
        locked,
        promotion.then(() => { throw new Error("Promotion settled before exposing its row lock."); }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Promotion did not reach its row lock.")), 5_000))
      ]);
      creatorRequest = patchArticle(request(`/api/admin/content/articles/${article.id}`, creatorCookie, { ...articlePayload(article), title: "Creator stale overwrite" }), { params: Promise.resolve({ articleId: article.id }) });
      const creatorPid = await waitForRowLock(blockerPid, creatorRequest);
      expect(creatorPid).not.toBe(blockerPid);
      release();
      await promotion;
      expect((await creatorRequest).status).toBe(403);
      expect(await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).toMatchObject({ title: "Race promoted", status: "PUBLISHED" });
      expect(await prisma.auditLog.count({ where: { actorId: ids.creator, resourceId: article.id } })).toBe(0);
    } finally {
      release();
      await promotion?.catch(() => undefined);
      await creatorRequest?.catch(() => undefined);
    }
  });

  it("keeps each concurrent writer response and audit attached to its locked before snapshot", async () => {
    const articleId = randomUUID(); fixtureIds.articles.add(articleId);
    const article = await prisma.article.create({
      data: {
        id: articleId,
        title: "Writer baseline",
        slug: `writers-${randomUUID()}`,
        locale: "en",
        excerpt: "Concurrent writer excerpt with enough detail",
        content: "Concurrent writer article body with enough detail for the validated content contract.",
        category: "Contracts",
        status: "DRAFT",
        authorId: ids.creator
      }
    });
    let release: () => void = () => undefined;
    let reached: (pid: number) => void = () => undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const locked = new Promise<number>((resolve) => { reached = resolve; });
    let blocker: Promise<void> | null = null;
    let firstRequest: Promise<Response> | null = null;
    let secondRequest: Promise<Response> | null = null;
    try {
      blocker = prisma.$transaction(async (tx) => {
        const [{ pid }] = await tx.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`;
        await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "articles" WHERE "id" = ${article.id}::uuid FOR UPDATE`);
        reached(pid);
        await gate;
      });
      const blockerPid = await Promise.race([
        locked,
        blocker.then(() => { throw new Error("Blocker settled before exposing its row lock."); }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Blocker did not reach its row lock.")), 5_000))
      ]);
      firstRequest = patchArticle(
        request(`/api/admin/content/articles/${article.id}`, approverCookie, { ...articlePayload(article, "REVIEW"), title: "First writer" }),
        { params: Promise.resolve({ articleId: article.id }) }
      );
      const firstWriterPid = await waitForRowLock(blockerPid, firstRequest);
      secondRequest = patchArticle(
        request(`/api/admin/content/articles/${article.id}`, secondApproverCookie, { ...articlePayload(article, "PUBLISHED"), title: "Second writer" }),
        { params: Promise.resolve({ articleId: article.id }) }
      );
      const secondWriterPid = await waitForRowLock(blockerPid, secondRequest, [firstWriterPid]);
      expect(secondWriterPid).not.toBe(firstWriterPid);
      release();
      await blocker;

      const [firstResponse, secondResponse] = await Promise.all([firstRequest, secondRequest]);
      expect([firstResponse.status, secondResponse.status]).toEqual([200, 200]);
      expect((await firstResponse.json()).data).toMatchObject({ title: "First writer", status: "REVIEW" });
      expect((await secondResponse.json()).data).toMatchObject({ title: "Second writer", status: "PUBLISHED" });
      expect(await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).toMatchObject({ title: "Second writer", status: "PUBLISHED" });

      const [firstAudit, secondAudit] = await Promise.all([
        prisma.auditLog.findFirstOrThrow({ where: { actorId: ids.approver, resourceId: article.id, action: "content.article_update" } }),
        prisma.auditLog.findFirstOrThrow({ where: { actorId: ids.secondApprover, resourceId: article.id, action: "content.article_update" } })
      ]);
      expect(firstAudit.metadata).toMatchObject({ previousStatus: "DRAFT", status: "REVIEW" });
      expect(secondAudit.metadata).toMatchObject({ previousStatus: "REVIEW", status: "PUBLISHED" });
    } finally {
      release();
      await blocker?.catch(() => undefined);
      await firstRequest?.catch(() => undefined);
      await secondRequest?.catch(() => undefined);
    }
  });
});
