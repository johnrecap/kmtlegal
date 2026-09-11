import { expect, test, type APIRequestContext } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../src/server/db/prisma";
import { savePrivateFile } from "../../src/server/storage/vps-storage";

const pdf = Buffer.from("%PDF-1.4\n% Disposable batch3 fixture\n%%EOF\n");
const marker = `batch3-${randomUUID()}`;
let clientId: string, otherClientId: string, caseId: string, otherCaseId: string;
let otherEmail: string;
const documents: Record<string, string> = {};
const scannerFailure = process.env.BATCH3_SCANNER_FAILURE === "true";

test.describe("batch3 isolated file HTTP boundaries", () => {
  test.skip(process.env.BATCH3_ISOLATED_DB !== "true", "Dedicated disposable cluster only");
  test.beforeAll(async ({ baseURL }) => {
    const url = new URL(process.env.DATABASE_URL || "");
    expect([url.hostname, url.port, url.pathname, process.env.APP_ENV, baseURL]).toEqual(["127.0.0.1", "55437", "/kmt_batch3", "local", "http://127.0.0.1:3109"]);
    expect(path.resolve(process.env.UPLOADS_DIR || "")).toBe(path.resolve("_workspace/batch3-postgres/uploads"));
    const rows = await prisma.$queryRaw<Array<{ directory: string; port: number }>>`SELECT current_setting('data_directory') AS directory, inet_server_port() AS port`;
    expect(path.resolve(rows[0].directory)).toBe(path.resolve("_workspace/batch3-postgres/data"));
    expect(rows[0].port).toBe(55437);
    expect(process.env.MALWARE_SCAN_MODE).toBe(scannerFailure ? "required" : "disabled");
    if (scannerFailure) {
      expect([process.env.CLAMAV_HOST, process.env.CLAMAV_PORT]).toEqual(["127.0.0.1", "55439"]);
      return;
    }
    const owner = await prisma.user.findUniqueOrThrow({ where: { email: "client@kmt.local" }, include: { clientProfile: true } });
    const lawyer = await prisma.user.findUniqueOrThrow({ where: { email: "lawyer@kmt.local" } });
    clientId = owner.clientProfile!.id;
    otherEmail = `${marker}@example.test`;
    const other = await prisma.user.create({ data: { name: "Other Test Client", email: otherEmail, passwordHash: owner.passwordHash, roleId: owner.roleId, status: "ACTIVE" } });
    otherClientId = (await prisma.client.create({ data: { userId: other.id, fullName: "Other Test Client", phone: "+201099999901" } })).id;
    caseId = (await prisma.legalCase.create({ data: { internalFileNumber: marker, title: "Assigned Test Case", caseType: "TEST", clientId, assignedLawyerId: lawyer.id } })).id;
    const unassignedLawyer = await prisma.user.create({ data: { name: "Other Test Lawyer", email: `${marker}-lawyer@example.test`, passwordHash: lawyer.passwordHash, roleId: lawyer.roleId } });
    otherCaseId = (await prisma.legalCase.create({ data: { internalFileNumber: `${marker}-other`, title: "Unassigned Test Case", caseType: "TEST", clientId: otherClientId, assignedLawyerId: unassignedLawyer.id } })).id;
    for (const visibility of ["CLIENT_VISIBLE", "STAFF_ONLY", "INTERNAL_ONLY"] as const) {
      const fileKey = `batch3/${marker}-${visibility}.pdf`;
      await savePrivateFile({ fileKey, bytes: pdf });
      documents[visibility] = (await prisma.document.create({ data: { ownerClientId: clientId, caseId, uploadedById: owner.id, fileKey, fileName: `${visibility}.pdf`, fileType: "application/pdf", fileSize: pdf.length, visibility } })).id;
    }
    const fileKey = `batch3/${marker}-unassigned.pdf`;
    await savePrivateFile({ fileKey, bytes: pdf });
    documents.unassigned = (await prisma.document.create({ data: { ownerClientId: otherClientId, caseId: otherCaseId, uploadedById: other.id, fileKey, fileName: "unassigned.pdf", fileType: "application/pdf", fileSize: pdf.length, visibility: "CLIENT_VISIBLE" } })).id;
  });
  test.afterAll(async () => { await prisma.$disconnect(); });

  for (const [actor, visibility, expected] of [
    ["guest", "CLIENT_VISIBLE", 401], ["client", "CLIENT_VISIBLE", 200], ["other", "CLIENT_VISIBLE", 403],
    ["client", "STAFF_ONLY", 403], ["client", "INTERNAL_ONLY", 403],
    ["office.admin", "CLIENT_VISIBLE", 200], ["office.admin", "INTERNAL_ONLY", 200],
    ["marketing", "CLIENT_VISIBLE", 403], ["marketing", "INTERNAL_ONLY", 403],
    ["lawyer", "CLIENT_VISIBLE", 200], ["lawyer", "INTERNAL_ONLY", 200], ["lawyer", "unassigned", 403]
  ] as const) {
    test(`download ${actor} / ${visibility} returns ${expected}`, async ({ request, baseURL }) => {
      test.skip(scannerFailure);
      if (actor !== "guest") await login(request, actor === "other" ? otherEmail : `${actor}@kmt.local`, baseURL!);
      const response = await request.get(`/api/files/${documents[visibility]}/download`);
      expect(response.status()).toBe(expected);
      if (expected === 200) {
        expect(createHash("sha256").update(await response.body()).digest("hex")).toBe(createHash("sha256").update(pdf).digest("hex"));
        expect(response.headers()["content-disposition"]).toContain("attachment");
        expect(response.headers()["x-content-type-options"]).toBe("nosniff");
      } else expect((await response.json()).error).toBeTruthy();
    });
  }

  test("upload rejects ownership, case mismatch, type and size without saving document rows", async ({ request, baseURL }) => {
    test.skip(scannerFailure);
    await login(request, "client@kmt.local", baseURL!);
    const before = await prisma.document.count();
    const filesBefore = await fs.readdir(process.env.UPLOADS_DIR!, { recursive: true });
    for (const [fields, file, status] of [
      [{ ownerClientId: otherClientId }, { name: "test.pdf", mimeType: "application/pdf", buffer: pdf }, 403],
      [{ caseId: otherCaseId }, { name: "test.pdf", mimeType: "application/pdf", buffer: pdf }, 403],
      [{}, { name: "test.exe", mimeType: "application/pdf", buffer: pdf }, 415],
      [{}, { name: "test.pdf", mimeType: "application/pdf", buffer: Buffer.from("not a PDF") }, 415],
      [{}, { name: "test.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 65) }, 413]
    ] as const) {
      const response = await request.post("/api/files/upload", { headers: { Origin: baseURL! }, multipart: { ...fields, file } });
      expect(response.status()).toBe(status);
    }
    await login(request, "office.admin@kmt.local", baseURL!);
    const mismatch = await request.post("/api/files/upload", { headers: { Origin: baseURL! }, multipart: { ownerClientId: clientId, caseId: otherCaseId, file: { name: "test.pdf", mimeType: "application/pdf", buffer: pdf } } });
    expect(mismatch.status()).toBe(400);
    expect(await prisma.document.count()).toBe(before);
    expect(await fs.readdir(process.env.UPLOADS_DIR!, { recursive: true })).toEqual(filesBefore);
  });

  for (const actor of ["client", "office.admin"]) test(`browser ${actor} upload reaches private storage and downloads identical bytes`, async ({ page, baseURL }) => {
    test.skip(scannerFailure);
    await login(page.request, `${actor}@kmt.local`, baseURL!);
    await page.goto(actor === "client" ? "/client/files" : "/admin/documents", { waitUntil: "domcontentloaded" });
    const fileName = `${marker}-${actor}-browser.pdf`;
    expect(await prisma.document.count({ where: { fileName } })).toBe(0);
    await page.locator('input[type="file"]').setInputFiles({ name: fileName, mimeType: "application/pdf", buffer: pdf });
    const form = page.locator('form').filter({ has: page.locator('input[type="file"]') });
    if (actor !== "client") {
      await form.locator('select[name="ownerClientId"]').selectOption(clientId);
      await form.locator('select[name="caseId"]').selectOption(caseId);
    } else {
      await form.locator('button[aria-haspopup="listbox"]').first().click();
      await form.getByRole('option').filter({ hasText: marker }).click();
    }
    const pending = page.waitForResponse(r => new URL(r.url()).pathname === "/api/files/upload");
    await form.locator('button[type="submit"]').click();
    const response = await pending;
    expect(response.status()).toBe(201);
    expect(await prisma.document.count({ where: { fileName } })).toBe(1);
    const record = await prisma.document.findFirstOrThrow({ where: { fileName } });
    expect(record.caseId).toBe(caseId);
    expect(record.ownerClientId).toBe(clientId);
    expect(record.visibility).toBe(actor === "client" ? "CLIENT_VISIBLE" : "STAFF_ONLY");
    expect(await fs.readFile(path.join(process.env.UPLOADS_DIR!, record.fileKey))).toEqual(pdf);
    const download = await page.request.get(`/api/files/${record.id}/download`);
    expect(download.status()).toBe(200);
    expect(await download.body()).toEqual(pdf);
  });



  test("multipart API returns the saved document JSON contract", async ({ request, baseURL }) => {
    test.skip(scannerFailure);
    await login(request, "client@kmt.local", baseURL!);
    const fileName = marker + "-api-contract.pdf";
    expect(await prisma.document.count({ where: { fileName } })).toBe(0);
    const response = await request.post("/api/files/upload", { headers: { Origin: baseURL! }, multipart: { caseId, visibility: "CLIENT_VISIBLE", category: "EVIDENCE", file: { name: fileName, mimeType: "application/pdf", buffer: pdf } } });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data).toMatchObject({ fileName, fileType: "application/pdf", fileSize: pdf.length, category: "EVIDENCE", visibility: "CLIENT_VISIBLE" });
    expect(body.data.id).toMatch(/^[0-9a-f-]{36}$/);
    const record = await prisma.document.findUniqueOrThrow({ where: { id: body.data.id } });
    expect(record.ownerClientId).toBe(clientId);
    expect(record.caseId).toBe(caseId);
    expect(await prisma.document.count({ where: { fileName } })).toBe(1);
  });

  test("upload forms are inert before hydration for client and staff", async ({ browser, baseURL }) => {
    test.skip(scannerFailure);
    for (const actor of ["client", "office.admin"]) {
      const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
      try {
        await login(context.request, actor + "@kmt.local", baseURL!);
        const page = await context.newPage();
        await page.goto(actor === "client" ? "/client/files" : "/admin/documents");
        const form = page.locator('form').filter({ has: page.locator('input[type="file"]') });
        await expect(form).toHaveAttribute("method", "post");
        await expect(form.locator('input[type="file"]')).toBeDisabled();
        await expect(form.locator('button[type="submit"]')).toBeDisabled();
      } finally { await context.close(); }
    }
  });

  test("required scanner outage returns 503 and writes no file or document", async ({ request, baseURL }) => {
    test.skip(!scannerFailure);
    await login(request, "client@kmt.local", baseURL!);
    const before = await prisma.document.count();
    const filesBefore = await fs.readdir(process.env.UPLOADS_DIR!, { recursive: true });
    const response = await request.post("/api/files/upload", { headers: { Origin: baseURL! }, multipart: { file: { name: "scanner-outage.pdf", mimeType: "application/pdf", buffer: pdf } } });
    expect(response.status()).toBe(503);
    expect((await response.json()).error.code).toBe("MALWARE_SCANNER_UNAVAILABLE");
    expect(await prisma.document.count()).toBe(before);
    expect(await fs.readdir(process.env.UPLOADS_DIR!, { recursive: true })).toEqual(filesBefore);
  });
});

async function login(request: APIRequestContext, email: string, origin: string) {
  expect((await request.post("/api/auth/login", { headers: { Origin: origin }, data: { email, password: "KmtLocalDev!2026" } })).status()).toBe(200);
}
