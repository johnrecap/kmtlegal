import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readdir, readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const fixture = vi.hoisted(() => ({ db: null as unknown as PrismaClient }));
vi.mock("@/server/db/prisma", () => ({ prisma: new Proxy({}, { get: (_, key) => {
  const value = fixture.db[key as keyof PrismaClient]; return typeof value === "function" ? value.bind(fixture.db) : value;
} }) }));
import { POST, GET } from "@/app/api/public/assistant/conversation/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as me } from "@/app/api/auth/me/route";
import { logoutByRequest } from "@/server/auth/auth-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { createServiceRequest, assertActiveServiceClient, getServiceRequest } from "@/server/services/service-request-service";
import { getAuthorizedDocumentDownload, uploadDocument } from "@/server/storage/document-service";
import { permissionsForRole } from "@/server/auth/policy";
import { capabilityHash } from "@/server/consultations/conversation-session-service";
import { registerConversationClient } from "@/server/portal/client-registration-service";

let db: PGlite, server: PGLiteSocketServer, uploads: string;
const password = "Synthetic-signup-only-2026";
const request = (cookie = "", body?: unknown, ip = randomUUID()) => new Request("http://127.0.0.1/api/public/assistant/conversation", {
  method: body ? "POST" : "GET", headers: { cookie, "Content-Type": "application/json", "x-kmt-locale": "ar", "x-real-ip": ip }, ...(body ? { body: JSON.stringify(body) } : {})
});
const cookieFrom = (response: Response) => response.headers.get("set-cookie")!.split(";")[0];
async function opened() {
  const started = await POST(request("", { action: "start", locale: "ar" }));
  const cookie = cookieFrom(started);
  const access = await POST(request(cookie, { action: "account_access" }));
  return { cookie, state: (await access.json()).data };
}
const fields = (revision: number, email = `${randomUUID()}@signup.invalid`) => ({ action: "register", revision, fullName: "عميل اختبار التسجيل", phone: "٠١٠١٢٣٤٥٦٧٨", email, password, confirmPassword: password });
async function registered() {
  const session = await opened(); const body = fields(session.state.revision);
  const response = await POST(request(session.cookie, body));
  expect(response.status).toBe(200);
  return { ...session, body, cookie: `${session.cookie}; ${cookieFrom(response)}`, data: (await response.json()).data };
}
beforeAll(async () => {
  vi.stubEnv("APP_ENV", "local"); vi.stubEnv("CLIENT_ACCOUNT_EMAIL_ENABLED", "false"); vi.stubEnv("SMTP_ENABLED", "false");
  vi.stubEnv("AI_PROVIDER", "custom"); vi.stubEnv("AI_API_KEY", ""); vi.stubEnv("MALWARE_SCAN_MODE", "disabled");
  uploads = await mkdtemp(path.join(tmpdir(), "kmt-signup-")); vi.stubEnv("UPLOADS_DIR", uploads);
  db = await PGlite.create();
  for (const name of (await readdir("prisma/migrations", { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name).sort()) await db.exec(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
  server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 55479, maxConnections: 6 }); await server.start();
  fixture.db = new PrismaClient({ adapter: new PrismaPg({ connectionString: "postgresql://postgres:synthetic@127.0.0.1:55479/template1", max: 1 }) });
  for (const name of ["Client", "Office Admin"]) {
    const role = await fixture.db.role.create({ data: { name, status: "ACTIVE" } });
    for (const key of permissionsForRole(name)) { const permission = await fixture.db.permission.upsert({ where: { key }, create: { key }, update: {} }); await fixture.db.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } }); }
  }
}, 60000);
afterAll(async () => { await fixture.db?.$disconnect(); await server?.stop(); await db?.close(); if (uploads) await rm(uploads, { recursive: true, force: true }); vi.unstubAllEnvs(); });

describe.sequential("direct registration with SMTP and provider unavailable (isolated SQL)", () => {
  it("representative Arabic signup, authenticated continuation, own requests and password login", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const result = await registered();
      expect(result.data).toMatchObject({ accountReady: true, submitted: false, dialogue: { mode: "INQUIRY", consentAt: null } });
      const identity = await me(request(result.cookie)); expect(identity.status).toBe(200);
      const user = (await identity.json()).user;
      expect(user).toMatchObject({ role: "Client", locale: "ar" });
      const stored = await fixture.db.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(stored.emailVerifiedAt).toBeNull(); expect(stored.passwordHash).not.toBe(password);
      expect((await GET(request(result.cookie))).status).toBe(200);
      const auth = await getAuthContextFromRequest(request(result.cookie));
      const service = await createServiceRequest(auth!.principal, { kind: "CONTRACT_REVIEW", locale: "ar", idempotencyKey: randomUUID() });
      expect(service.clientId).toBe(user.clientId);
      await logoutByRequest(request(result.cookie));
      expect((await me(request(result.cookie))).status).toBe(401);
      const signedIn = await login(request("", { email: result.body.email, password }));
      expect(signedIn.status).toBe(200);
      const restored = `${result.cookie.split(";")[0]}; ${cookieFrom(signedIn)}`;
      expect((await GET(request(restored))).status).toBe(200);
      expect(await fixture.db.clientVerificationToken.count()).toBe(0);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(JSON.stringify(await fixture.db.assistantTurn.findMany())).not.toContain(password);
      expect(JSON.stringify(await fixture.db.auditLog.findMany())).not.toContain(password);
    } finally { fetchSpy.mockRestore(); }
  });

  it("validates fields, rejects unauthorized opening/stale revisions and throttles independently of booking", async () => {
    const start = await POST(request("", { action: "start", locale: "ar" })); const cookie = cookieFrom(start);
    expect((await POST(request(cookie, fields(0)))).status).toBe(403);
    const access = (await (await POST(request(cookie, { action: "account_access" }))).json()).data;
    for (const patch of [{ password: "short" }, { confirmPassword: "different-password" }, { phone: "bad" }, { email: "bad" }, { fullName: "x" }, { roleId: randomUUID() }]) expect((await POST(request(cookie, { ...fields(access.revision), ...patch }))).status).toBe(400);
    expect((await POST(request(cookie, fields(access.revision - 1)))).status).toBe(409);
    for (const limitBy of ["email", "ip"]) {
      const email = `${randomUUID()}@signup.invalid`, ip = randomUUID();
      const limitedRequest = () => request(cookie, fields(0, limitBy === "email" ? email : `${randomUUID()}@signup.invalid`), limitBy === "ip" ? ip : randomUUID());
      // Ten allowed attempts also prove registration does not consume the five-request booking quota.
      for (let i = 0; i < 10; i++) expect((await POST(limitedRequest())).status).toBe(409);
      expect((await POST(limitedRequest())).status).toBe(429);
    }
  });

  it("never modifies existing staff/client accounts or claims matching historical contacts", async () => {
    const result = await registered();
    const role = await fixture.db.role.findUniqueOrThrow({ where: { name: "Office Admin" } });
    const staff = await fixture.db.user.create({ data: { name: "Synthetic staff", email: `${randomUUID()}@signup.invalid`, roleId: role.id, status: "ACTIVE" } });
    for (const email of [result.body.email.toUpperCase(), staff.email]) {
      const openedSession = await opened(); const duplicate = await POST(request(openedSession.cookie, fields(openedSession.state.revision, email)));
      expect(duplicate.status).toBe(409); expect((await duplicate.json()).error.code).toBe("ACCOUNT_EMAIL_UNAVAILABLE");
    }
    const history = await fixture.db.client.create({ data: { fullName: "Historical", email: `${randomUUID()}@signup.invalid`, phone: "01012345678" } });
    const session = await opened(); const response = await POST(request(session.cookie, fields(session.state.revision, history.email!)));
    expect(response.status).toBe(200);
    expect((await fixture.db.client.findUniqueOrThrow({ where: { id: history.id } })).userId).toBeNull();
    expect((await fixture.db.user.findUniqueOrThrow({ where: { id: staff.id } })).passwordHash).toBeNull();
  });

  it("rejects expired capabilities, disabled client roles and replacing an already signed-in identity", async () => {
    const expired = await opened();
    await fixture.db.assistantSession.update({ where: { capabilityHash: capabilityHash(expired.cookie.split("=")[1]) }, data: { expiresAt: new Date(0) } });
    expect((await POST(request(expired.cookie, fields(expired.state.revision)))).status).toBe(401);
    const session = await opened(); const body = fields(session.state.revision);
    await fixture.db.role.update({ where: { name: "Client" }, data: { status: "DISABLED" } });
    try { expect((await POST(request(session.cookie, body))).status).toBe(503); }
    finally { await fixture.db.role.update({ where: { name: "Client" }, data: { status: "ACTIVE" } }); }
    expect(await fixture.db.user.count({ where: { email: body.email } })).toBe(0);
    const signedIn = await registered();
    expect((await POST(request(signedIn.cookie, fields(signedIn.data.revision)))).status).toBe(409);
    expect((await me(request(signedIn.cookie))).status).toBe(200);
  });

  it("serializes duplicate signup and rolls back account/session creation on a failed audit", async () => {
    const first = await opened(), second = await opened(); const email = `${randomUUID()}@signup.invalid`;
    const responses = await Promise.all([POST(request(first.cookie, fields(first.state.revision, email))), POST(request(second.cookie, fields(second.state.revision, email)))]);
    expect(responses.map(r => r.status).sort()).toEqual([200, 409]);
    expect(await fixture.db.user.count({ where: { email } })).toBe(1);
    const session = await opened(); const body = fields(session.state.revision); const { action: _action, ...data } = body;
    const before = await fixture.db.session.count();
    // A real DB constraint failure after all writes must roll them all back.
    await db.exec(`CREATE FUNCTION reject_signup_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action = 'client.account.registered' THEN RAISE EXCEPTION 'synthetic audit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_signup BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION reject_signup_audit();`);
    try { await expect(registerConversationClient({ capability: session.cookie.split("=")[1], body: data, request: request() })).rejects.toBeDefined(); }
    finally { await db.exec("DROP TRIGGER reject_signup ON audit_logs; DROP FUNCTION reject_signup_audit();"); }
    expect(await fixture.db.user.count({ where: { email: body.email } })).toBe(0);
    expect(await fixture.db.session.count()).toBe(before);
  });

  it("binds only this session's guest booking and protects requests/uploads from other clients", async () => {
    const guest = await opened(); const session = await fixture.db.assistantSession.findUniqueOrThrow({ where: { capabilityHash: capabilityHash(guest.cookie.split("=")[1]) } });
    const lead = await fixture.db.client.create({ data: { fullName: "Guest", phone: "01012345678", source: "assistant_guest_booking" } });
    const booking = await fixture.db.consultationRequest.create({ data: { fullName: "Guest", phone: lead.phone, clientId: lead.id, serviceCategory: "corporate", summary: "Synthetic booking", preferredMode: "PHONE", confirmationSource: "CALLBACK_REQUEST" } });
    await fixture.db.assistantSession.update({ where: { id: session.id }, data: { consultationRequestId: booking.id } });
    const response = await POST(request(guest.cookie, fields(guest.state.revision)));
    expect(response.status).toBe(200); const ownCookie = `${guest.cookie}; ${cookieFrom(response)}`;
    const owner = (await getAuthContextFromRequest(request(ownCookie)))!.principal;
    expect((await fixture.db.consultationRequest.findUniqueOrThrow({ where: { id: booking.id } })).clientId).toBe(owner.clientId);
    const other = await registered(); const otherActor = (await getAuthContextFromRequest(request(other.cookie)))!.principal;
    expect((await GET(request(`${guest.cookie}; ${other.cookie.split("; ")[1]}`))).status).toBe(401);
    await expect(assertActiveServiceClient({ ...otherActor, clientId: owner.clientId })).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    const service = await createServiceRequest(owner, { kind: "CONTRACT_DRAFT", locale: "ar", idempotencyKey: randomUUID() });
    const bytes = Buffer.from("%PDF-1.7\nsynthetic signup upload\n%%EOF");
    const document = await uploadDocument({ actor: owner, fields: { serviceRequestId: service.id }, file: { fileName: "synthetic.pdf", mimeType: "application/pdf", sizeBytes: bytes.length, bytes } });
    await expect(getServiceRequest(otherActor, service.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getAuthorizedDocumentDownload({ actor: otherActor, documentId: document.id })).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    const download = await getAuthorizedDocumentDownload({ actor: owner, documentId: document.id }); expect(Buffer.from(download.bytes)).toEqual(bytes);
  });
});
