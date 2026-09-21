import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { contentLifecycleUiCopy } from "@/lib/ui-copy";
import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/prisma";

const enabled = process.env.RUN_BATCH14_BROWSER === "true" && Boolean(process.env.DATABASE_URL);
const expectedDataDirectory = "C:/Users/SOUQ/.codex/worktrees/a701/kmt legal office/_workspace/batch10-postgres/data";
const marker = "batch14-browser-content";
const password = "Batch14-Browser!2026";
const createdArticleSlug = `created-${randomUUID()}`;
const ids = { creator: randomUUID(), approver: randomUUID(), publishedArticle: randomUUID(), draftArticle: randomUUID(), draftStudy: randomUUID() };
let creatorRoleId = "";
let approverRoleId = "";

async function assertSyntheticEnvironment() {
  if (process.env.APP_ENV !== "local") throw new Error("Batch14 browser requires APP_ENV=local.");
  const parsed = new URL(process.env.DATABASE_URL!);
  if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55441" || parsed.pathname !== "/kmt_batch10" || parsed.username !== "kmt_batch10") throw new Error("Batch14 browser requires the authorized isolated database identity.");
  const rows = await prisma.$queryRaw<Array<{ database: string; username: string; port: number; dataDirectory: string }>>`SELECT current_database() AS database, current_user AS username, inet_server_port() AS port, current_setting('data_directory') AS "dataDirectory"`;
  const current = rows[0];
  if (!current || current.database !== "kmt_batch10" || current.username !== "kmt_batch10" || current.port !== 55441 || current.dataDirectory.replaceAll("\\", "/") !== expectedDataDirectory) throw new Error("Batch14 browser database identity verification failed.");
  const markerRow = await prisma.$queryRaw<Array<{ marker: string }>>`SELECT marker FROM batch10_marker WHERE marker = 'synthetic-batch10-only'`;
  if (markerRow[0]?.marker !== "synthetic-batch10-only") throw new Error("Batch14 browser marker missing.");
}

async function login(page: Page, email: string, baseURL: string) {
  await page.context().clearCookies();
  const response = await page.request.post("/api/auth/login", { data: { email, password }, headers: { Origin: new URL(baseURL).origin } });
  expect(response.status()).toBe(200);
}

test.describe.serial("batch14 content lifecycle browser", () => {
  test.skip(!enabled, "Requires the authorized Batch14 browser/PostgreSQL lane.");
  test.setTimeout(120_000);

  test.beforeAll(async () => {
    await assertSyntheticEnvironment();
    const [creatorRole, approverRole] = await Promise.all([
      prisma.role.create({ data: { name: "Marketing Staff", status: "ACTIVE" } }),
      prisma.role.create({ data: { name: "Office Admin", status: "ACTIVE" } })
    ]);
    creatorRoleId = creatorRole.id; approverRoleId = approverRole.id;
    for (const key of ["content.create.any", "content.approve.any", "caseStudy.create.any", "caseStudy.approve.any", "socialDraft.create.any", "socialDraft.approve.any"]) {
      const permission = await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
      if (key.endsWith("create.any")) await prisma.rolePermission.create({ data: { roleId: creatorRoleId, permissionId: permission.id } });
      await prisma.rolePermission.create({ data: { roleId: approverRoleId, permissionId: permission.id } });
    }
    const passwordHash = await hashPassword(password);
    await prisma.user.createMany({ data: [
      { id: ids.creator, name: `${marker} creator`, email: `${ids.creator}@example.test`, passwordHash, roleId: creatorRoleId, status: "ACTIVE" },
      { id: ids.approver, name: `${marker} approver`, email: `${ids.approver}@example.test`, passwordHash, roleId: approverRoleId, status: "ACTIVE" }
    ] });
    await prisma.article.createMany({ data: [
      { id: ids.publishedArticle, title: "Protected browser article", slug: `protected-${ids.publishedArticle}`, locale: "en", excerpt: "Protected browser article excerpt", content: "Protected browser article content with enough validated detail.", category: "Contracts", status: "PUBLISHED", publishedAt: new Date(), authorId: ids.approver },
      { id: ids.draftArticle, title: "Draft browser article", slug: `draft-${ids.draftArticle}`, locale: "en", excerpt: "Draft browser article excerpt with detail", content: "Draft browser article content with enough validated detail.", category: "Contracts", status: "DRAFT", authorId: ids.creator }
    ] });
    await prisma.caseStudy.create({ data: { id: ids.draftStudy, title: "Draft browser study", slug: `study-${ids.draftStudy}`, locale: "en", category: "Contracts", challenge: "A safe browser challenge description", approach: "A safe browser approach description", generalOutcome: "A safe browser general outcome", lessons: "A safe browser lessons description", status: "DRAFT", isAnonymized: true } });
  });

  test.afterAll(async () => {
    await assertSyntheticEnvironment();
    await prisma.auditLog.deleteMany({ where: { actorId: { in: [ids.creator, ids.approver] } } });
    await prisma.article.deleteMany({ where: { OR: [{ id: { in: [ids.publishedArticle, ids.draftArticle] } }, { slug: createdArticleSlug }] } });
    await prisma.caseStudy.deleteMany({ where: { id: ids.draftStudy } });
    await prisma.session.deleteMany({ where: { userId: { in: [ids.creator, ids.approver] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ids.creator, ids.approver] } } });
    await prisma.role.deleteMany({ where: { id: { in: [creatorRoleId, approverRoleId] } } });
    expect(await prisma.article.count({ where: { id: { in: [ids.publishedArticle, ids.draftArticle] } } })).toBe(0);
    expect(await prisma.caseStudy.count({ where: { id: ids.draftStudy } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { actorId: { in: [ids.creator, ids.approver] } } })).toBe(0);
    await prisma.$disconnect();
  });

  test("shows protected creator view at desktop and publishes creator drafts through an approver at mobile", async ({ page }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3115");
    const consoleErrors: string[] = []; const pageErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.setViewportSize({ width: 1440, height: 1000 });
    await login(page, `${ids.creator}@example.test`, baseURL);
    await page.goto(`/admin/content?tab=articles&editType=article&editId=${ids.publishedArticle}`, { waitUntil: "domcontentloaded" });
    const protectedArticleForm = page.locator("form").filter({ has: page.getByRole("button", { name: "حفظ المقال" }) });
    await expect(protectedArticleForm.getByLabel("الحالة")).toHaveValue("PUBLISHED");
    await expect(page.getByText(/الحالة الحالية: منشور/)).toBeVisible();
    await expect(protectedArticleForm.getByLabel("عنوان المقال")).toBeDisabled();
    await expect(protectedArticleForm.getByRole("button", { name: "حفظ المقال" })).toBeDisabled();
    await page.screenshot({ path: "docs/reviews/2026-09-13/batch14/evidence/protected-article-1440.png", fullPage: true, caret: "initial" });

    expect((await page.request.get(`/api/public/articles/${`draft-${ids.draftArticle}`}?locale=en`)).status()).toBe(404);
    expect((await page.request.get(`/api/public/case-studies/${`study-${ids.draftStudy}`}?locale=en`)).status()).toBe(404);
    await page.goto(`/admin/content?tab=articles&editType=article&editId=${ids.draftArticle}`, { waitUntil: "domcontentloaded" });
    const creatorEditForm = page.locator("form").filter({ has: page.getByRole("button", { name: "حفظ المقال" }) });
    await creatorEditForm.getByLabel("عنوان المقال").fill("Creator reviewed browser article");
    await creatorEditForm.getByLabel("الحالة").selectOption("REVIEW");
    await creatorEditForm.getByRole("button", { name: "حفظ المقال" }).click();
    await expect(page.getByText("تم حفظ المقال.")).toBeVisible();

    await login(page, `${ids.approver}@example.test`, baseURL);
    await page.goto(`/admin/content?tab=articles&editType=article&editId=${ids.draftArticle}`, { waitUntil: "domcontentloaded" });
    const approverArticleForm = page.locator("form").filter({ has: page.getByRole("button", { name: "حفظ المقال" }) });
    await approverArticleForm.getByLabel("الحالة").selectOption("PUBLISHED");
    await approverArticleForm.getByRole("button", { name: "حفظ المقال" }).click();
    await expect(page.getByText("تم حفظ المقال.")).toBeVisible();
    // Owner decision (launch fixes TASK 02): published articles stay out of public APIs.
    expect((await page.request.get(`/api/public/articles/${`draft-${ids.draftArticle}`}?locale=en`)).status()).toBe(404);

    await login(page, `${ids.creator}@example.test`, baseURL);
    await page.goto("/admin/content?tab=articles", { waitUntil: "domcontentloaded" });
    const createArticleForm = page.locator("form").filter({ has: page.getByRole("button", { name: "إنشاء مقال" }) });
    await createArticleForm.getByLabel("عنوان المقال").fill("Typed browser rejection");
    await createArticleForm.getByLabel("معرّف الرابط (Slug)").fill(`draft-${ids.draftArticle}`);
    await createArticleForm.getByLabel("التصنيف").fill("Contracts");
    await createArticleForm.getByLabel("الملخص").fill("Browser creation excerpt with enough detail");
    await createArticleForm.getByLabel("المحتوى", { exact: true }).fill("Browser creation content with enough detail for the validated content contract.");
    await createArticleForm.getByRole("button", { name: "إنشاء مقال" }).click();
    await expect(page.getByText(contentLifecycleUiCopy.duplicateSlug)).toBeVisible();
    await expect(createArticleForm.getByLabel("عنوان المقال")).toHaveValue("Typed browser rejection");
    await expect(createArticleForm.getByLabel("معرّف الرابط (Slug)")).toHaveValue(`draft-${ids.draftArticle}`);

    await createArticleForm.getByLabel("عنوان المقال").fill("Created browser article");
    await createArticleForm.getByLabel("معرّف الرابط (Slug)").fill(createdArticleSlug);
    const createdResponse = page.waitForResponse((response) => response.url().endsWith("/api/admin/content/articles") && response.request().method() === "POST");
    await createArticleForm.getByRole("button", { name: "إنشاء مقال" }).click();
    expect((await createdResponse).status()).toBe(201);
    await expect(page.getByText("تم إنشاء المقال.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Created browser article" })).toBeVisible();
    await expect(page.getByText("تم إنشاء المقال.")).toBeVisible();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: "Created browser article" })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, `${ids.approver}@example.test`, baseURL);
    await page.goto(`/admin/content?tab=case-studies&editType=caseStudy&editId=${ids.draftStudy}`, { waitUntil: "domcontentloaded" });
    const approverStudyForm = page.locator("form").filter({ has: page.getByRole("button", { name: "حفظ دراسة الحالة" }) });
    await approverStudyForm.getByLabel("الحالة", { exact: true }).selectOption("PUBLISHED");
    await approverStudyForm.getByRole("button", { name: "حفظ دراسة الحالة" }).click();
    await expect(page.getByText("تم حفظ دراسة الحالة.")).toBeVisible();
    // Owner decision (launch fixes TASK 02): published case studies stay out of public APIs.
    expect((await page.request.get(`/api/public/case-studies/${`study-${ids.draftStudy}`}?locale=en`)).status()).toBe(404);
    const publishedStudyCard = page.locator("article").filter({ has: page.getByRole("link", { name: "Draft browser study" }) });
    await expect(publishedStudyCard.getByText("منشور", { exact: true })).toBeVisible();
    await expect(publishedStudyCard.getByText(`${marker} approver`, { exact: true })).toBeVisible();
    await expect(page.getByText("تم حفظ دراسة الحالة.")).toBeVisible();
    await page.screenshot({ path: "docs/reviews/2026-09-13/batch14/evidence/published-study-390.png", fullPage: true, caret: "initial" });
    const unexpectedConsoleErrors = consoleErrors.filter((message) => !message.includes("status of 409 (Conflict)"));
    expect(unexpectedConsoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
