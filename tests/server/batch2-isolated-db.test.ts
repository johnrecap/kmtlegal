import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/prisma";
import { loginWithPassword, logoutByRequest } from "@/server/auth/auth-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { getPortalCaseDetail, listPortalDocuments } from "@/server/portal/client-portal-service";
import { getAuthorizedDocumentDownload } from "@/server/storage/document-service";
import { savePrivateFile } from "@/server/storage/vps-storage";
import { handlePublicConsultationAssistant } from "@/server/consultations/consultation-assistant-service";
import { listPublicConsultationSlots } from "@/server/consultations/consultation-availability-service";

const enabled = process.env.BATCH2_ISOLATED_DB === "true";
const marker = `batch2-${randomUUID()}`;
const phonePrefix = `+2010${String(Date.now()).slice(-6)}`;
const request = () => new Request("http://127.0.0.1:3109", { headers: { "x-real-ip": "127.0.0.81" } });

describe.skipIf(!enabled)("batch 2 isolated PostgreSQL behavior", () => {
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL || "");
    if (url.hostname !== "127.0.0.1" || url.port !== "55437" || url.pathname !== "/kmt_batch2" || process.env.APP_ENV !== "local") throw new Error("Requires the dedicated batch2 disposable database");
    const expectedUploads = path.resolve("_workspace/batch2-postgres/uploads");
    if (!process.env.UPLOADS_DIR || path.resolve(process.env.UPLOADS_DIR) !== expectedUploads) throw new Error("Requires the dedicated batch2 uploads directory");
    const rows = await prisma.$queryRaw<Array<{ directory: string; port: number }>>`SELECT current_setting('data_directory') AS directory, inet_server_port() AS port`;
    expect(rows[0].port).toBe(55437);
    expect(rows[0].directory.replaceAll("\\", "/")).toBe(`${process.cwd().replaceAll("\\", "/")}/_workspace/batch2-postgres/data`);
  });
  afterAll(async () => { await prisma.$disconnect(); });

  it("reruns the seed without duplicate localized content or operational rows", async () => {
    const counts = async () => Promise.all([prisma.article.count(), prisma.caseStudy.count(), prisma.user.count(), prisma.legalCase.count(), prisma.appointment.count()]);
    const before = await counts();
    execFileSync(process.execPath, ["prisma/seed.mjs"], { env: process.env, windowsHide: true, stdio: "pipe" });
    expect(await counts()).toEqual(before);
    expect(await prisma.article.count({ where: { locale: "ar", slug: "contract-risk-basics" } })).toBe(1);
    expect(await prisma.caseStudy.count({ where: { locale: "ar", slug: "anonymous-commercial-dispute" } })).toBe(1);
  });

  it("resolves live permissions and rejects suspended, inactive-role, expired and revoked sessions", async () => {
    const login = await loginWithPassword({ email: "client@kmt.local", password: "KmtLocalDev!2026", request: request() });
    expect(login?.status).toBe("authenticated");
    if (!login) throw new Error("Fixture login failed");
    const authenticated = new Request("http://127.0.0.1:3109/api/auth/me", { headers: { cookie: `kmt_session=${login.token}` } });
    const context = await getAuthContextFromRequest(authenticated);
    expect(context?.principal.clientId).toBeTruthy();
    if (!context) throw new Error("Fixture session missing");
    const role = await prisma.role.findUniqueOrThrow({ where: { id: context.user.roleId }, include: { permissions: true } });
    const assignment = role.permissions[0];
    try {
      if (!assignment) throw new Error("Fixture role permission missing");
      await prisma.rolePermission.delete({ where: { roleId_permissionId: { roleId: assignment.roleId, permissionId: assignment.permissionId } } });
      expect((await getAuthContextFromRequest(authenticated))?.principal.permissions?.length).toBe(role.permissions.length - 1);
      await prisma.user.update({ where: { id: context.user.id }, data: { status: "SUSPENDED" } });
      expect(await getAuthContextFromRequest(authenticated)).toBeNull();
      await prisma.user.update({ where: { id: context.user.id }, data: { status: "ACTIVE" } });
      await prisma.role.update({ where: { id: role.id }, data: { status: "DISABLED" } });
      expect(await getAuthContextFromRequest(authenticated)).toBeNull();
    } finally {
      await prisma.user.update({ where: { id: context.user.id }, data: { status: "ACTIVE" } });
      await prisma.role.update({ where: { id: role.id }, data: { status: "ACTIVE" } });
      if (assignment) await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: assignment.roleId, permissionId: assignment.permissionId } }, create: assignment, update: {} });
    }
    await prisma.session.update({ where: { id: context.sessionId }, data: { expiresAt: new Date(0) } });
    expect(await getAuthContextFromRequest(authenticated)).toBeNull();
    await prisma.session.update({ where: { id: context.sessionId }, data: { expiresAt: new Date(Date.now() + 60_000) } });
    await logoutByRequest(authenticated);
    expect(await getAuthContextFromRequest(authenticated)).toBeNull();
    expect((await prisma.session.findUniqueOrThrow({ where: { id: context.sessionId } })).status).toBe("REVOKED");
  });

  it("isolates case details and private document bytes across clients and visibility", async () => {
    expect(path.resolve(process.env.UPLOADS_DIR!)).toBe(path.resolve("_workspace/batch2-postgres/uploads"));
    const role = await prisma.role.findUniqueOrThrow({ where: { name: "Client" } });
    const owner = await prisma.user.findUniqueOrThrow({ where: { email: "client@kmt.local" }, include: { clientProfile: true } });
    const outsider = await prisma.user.create({ data: { name: marker, email: `${marker}@example.test`, passwordHash: owner.passwordHash, roleId: role.id } });
    const otherClient = await prisma.client.create({ data: { userId: outsider.id, fullName: marker, phone: "+201011111199" } });
    const own = { id: owner.id, roleName: "Client", clientId: owner.clientProfile!.id, permissions: ["client.read.self", "document.read.own"] };
    const other = { ...own, id: outsider.id, clientId: otherClient.id };
    const lawyer = await prisma.user.findUniqueOrThrow({ where: { email: "lawyer@kmt.local" } });
    const legalCase = await prisma.legalCase.create({ data: { internalFileNumber: marker, clientId: own.clientId, assignedLawyerId: lawyer.id, title: marker, caseType: "TEST" } });
    await expect(getPortalCaseDetail(other, legalCase.id)).rejects.toMatchObject({ status: 404 });
    expect((await getPortalCaseDetail(own, legalCase.id)).id).toBe(legalCase.id);
    const fileKey = `batch2/${marker}.txt`;
    await savePrivateFile({ fileKey, bytes: Buffer.from("disposable document bytes") });
    const document = await prisma.document.create({ data: { ownerClientId: own.clientId, uploadedById: owner.id, fileKey, fileName: "fixture.txt", fileType: "text/plain", fileSize: 25, visibility: "CLIENT_VISIBLE" } });
    expect((await listPortalDocuments(other)).some(row => row.id === document.id)).toBe(false);
    await expect(getAuthorizedDocumentDownload({ actor: other, documentId: document.id })).rejects.toMatchObject({ status: 403 });
    expect((await getAuthorizedDocumentDownload({ actor: own, documentId: document.id })).bytes.toString()).toBe("disposable document bytes");
    await prisma.document.update({ where: { id: document.id }, data: { visibility: "INTERNAL_ONLY" } });
    await expect(getAuthorizedDocumentDownload({ actor: own, documentId: document.id })).rejects.toMatchObject({ status: 403 });
  });

  it("commits only one actual free booking when two contacts race for one slot", async () => {
    await prisma.systemSetting.upsert({ where: { key: "consultation.booking" }, create: { key: "consultation.booking", value: { mode: "AI_CHAT_FREE" } }, update: { value: { mode: "AI_CHAT_FREE" } } });
    const slots = await listPublicConsultationSlots({ limit: 3 });
    expect(slots.length).toBeGreaterThan(0);
    const results = await Promise.all([`${phonePrefix}31`, `${phonePrefix}32`].map(phone => book(phone, slots[0].startsAt)));
    expect(results.filter(result => result.reference), JSON.stringify(results)).toHaveLength(1);
    expect(await prisma.appointment.count({ where: { startsAt: new Date(slots[0].startsAt), type: "CONSULTATION", status: "SCHEDULED" } })).toBe(1);
  }, 20_000);

  it("does not duplicate a contact when two confirmations target different slots", async () => {
    const slots = await listPublicConsultationSlots({ limit: 3 });
    expect(slots.length).toBeGreaterThan(1);
    const results = await Promise.all(slots.slice(0, 2).map(slot => book(`${phonePrefix}33`, slot.startsAt)));
    expect(results.filter(result => result.reference), JSON.stringify(results)).toHaveLength(1);
    expect(await prisma.consultationRequest.count({ where: { phone: `${phonePrefix}33`, status: "SCHEDULED" } })).toBe(1);
  }, 20_000);
});

async function book(phone: string, selectedSlot: string) {
  return await handlePublicConsultationAssistant({ request: request(), requestId: randomUUID(), body: {
    locale: "en", message: "Confirm", confirmBooking: true, selectedSlot, consent: true,
    draft: { fullName: "Example Booking Client", phone, city: "Cairo", serviceCategory: "legal-consultation", summary: "Review a disputed commercial contract delivery clause", preferredMode: "ONLINE", startsAt: selectedSlot }
  } }) as { reference?: string };
}
