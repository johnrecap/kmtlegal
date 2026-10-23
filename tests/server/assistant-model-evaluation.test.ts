import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { createHash, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { assistantEvaluationCases, evaluationVersion } from "../fixtures/assistant-evaluation";
import { liveAIKeys } from "./helpers/live-assistant-evaluation";
import { permissionsForRole, type Principal } from "@/server/auth/policy";

const fixture = vi.hoisted(() => ({ db: null as unknown as PrismaClient }));
vi.mock("@/server/db/prisma", () => ({ prisma: new Proxy({}, { get: (_target, key) => {
  const value = fixture.db[key as keyof PrismaClient]; return typeof value === "function" ? value.bind(fixture.db) : value;
} }) }));
import { createAssistantSession, capabilityHash, readAssistantSession, sendAssistantMessage } from "@/server/consultations/conversation-session-service";
const enabled = process.env.RUN_ASSISTANT_MATRIX === "true";
const nativeFetch = globalThis.fetch;
let database: PGlite | undefined, socket: PGLiteSocketServer | undefined;
let roleId: string;
beforeAll(async () => {
  if (!enabled) return;
  database = await PGlite.create();
  for (const name of (await readdir("prisma/migrations", { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name).sort()) await database.exec(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
  socket = new PGLiteSocketServer({ db: database, host: "127.0.0.1", port: 55519, maxConnections: 3 }); await socket.start();
  fixture.db = new PrismaClient({ adapter: new PrismaPg({ connectionString: "postgresql://postgres:synthetic@127.0.0.1:55519/template1", max: 1 }) });
  const role = await fixture.db.role.create({ data: { name: "Client", status: "ACTIVE" } }); roleId = role.id;
  for (const key of permissionsForRole("Client")) {
    const permission = await fixture.db.permission.upsert({ where: { key }, create: { key }, update: {} });
    await fixture.db.rolePermission.create({ data: { roleId, permissionId: permission.id } });
  }
}, 60_000);
afterAll(async () => { await fixture.db?.$disconnect(); await socket?.stop(); await database?.close(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it.skipIf(!enabled)("records the real three-model synthetic matrix without awarding semantic or legal acceptance", async () => {
  const env = parseEnv(await readFile(process.env.KMT_LIVE_AI_ENV_FILE || ".env", "utf8"));
  expect(env.AI_PROVIDER).toBe("openrouter"); expect(!!env.AI_API_KEY).toBe(true);
  const routes = JSON.parse(env.AI_EVALUATION_ROUTES || "{}");
  const directory = process.env.ASSISTANT_EVALUATION_OUTPUT || "_workspace/assistant-evaluation";
  await mkdir(directory, { recursive: true });
  const canary = process.env.ASSISTANT_CANARY === "true";
  const representative = process.env.ASSISTANT_REPRESENTATIVE === "true";
  const selected = representative ? assistantEvaluationCases.filter(c => c.id === "L01") : canary ? assistantEvaluationCases.filter(c => ["L01", "L03", "L04", "A05", "F07", "F10"].includes(c.id)) : process.env.ASSISTANT_EVALUATION_SPLIT === "development" ? assistantEvaluationCases.filter(c => !c.holdout) : assistantEvaluationCases;
  const models = canary || representative ? [process.env.ASSISTANT_EVALUATION_MODEL || env.AI_MODEL || "deepseek/deepseek-v4.1-flash"] : process.env.ASSISTANT_COMPARE_MODELS === "true" ? ["deepseek/deepseek-v4.1-flash", "openai/gpt-6.1-sol", "anthropic/claude-sonnet-5.5"] : ["deepseek/deepseek-v4.1-flash"];
  const fingerprint = createHash("sha256");
  async function fingerprintDirectory(directory: string) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await fingerprintDirectory(file);
      else if (entry.isFile()) fingerprint.update(file).update(await readFile(file));
    }
  }
  await fingerprintDirectory("src"); await fingerprintDirectory("prisma");
  for (const file of ["package-lock.json", "tests/fixtures/assistant-evaluation.ts", "tests/server/assistant-model-evaluation.test.ts"]) fingerprint.update(file).update(await readFile(file));
  const sourceHash = fingerprint.digest("hex");
  await writeFile(`${directory}/matrix-manifest.json`, JSON.stringify({ sourceHash, version: evaluationVersion, models, cases: assistantEvaluationCases.map(c => ({ id: c.id, group: c.group, holdout: c.holdout, fault: c.fault ?? null, expectedTurns: c.messages.length })) }, null, 2));
  const canaryResults: Array<{ scenario: string; errors: string[]; elapsed: number[]; costUsd: number | null }> = [];
  for (const model of models) {
    expect(routes[model]).toHaveLength(1);
    for (let repetition = 1; repetition <= (canary || representative ? 1 : 3); repetition++) for (const scenario of selected) {
      for (const key of liveAIKeys) vi.stubEnv(key, env[key] ?? "");
      vi.stubEnv("AI_MODEL", model); vi.stubEnv("AI_OPENROUTER_PROVIDERS", routes[model].join(","));
      vi.stubEnv("AI_ACTIONS_ENABLED", "true"); vi.stubEnv("AI_ACTION_CLIENT_IDS", "*");
      const user = await fixture.db.user.create({ data: { name: "Synthetic evaluation client", email: `${randomUUID()}@synthetic.invalid`, status: "ACTIVE", roleId } });
      const client = await fixture.db.client.create({ data: { userId: user.id, fullName: user.name, phone: "01099998888", status: "ACTIVE" } });
      const actor: Principal = { id: user.id, clientId: client.id, roleName: "Client" };
      const service = await fixture.db.serviceRequest.create({ data: { clientId: client.id, kind: "CONTRACT_REVIEW", locale: "ar", status: "AWAITING_ACCEPTANCE", quoteVersion: 1, quote: { amount: "100", currency: "EGP", scope: "Synthetic review of one contract", durationDays: 3 }, reference: `SYNTHETIC-${randomUUID()}`, idempotencyKey: randomUUID(), intake: {} } });
      for (const title of ["Synthetic lease dispute", "Synthetic contract dispute"]) await fixture.db.legalCase.create({ data: { clientId: client.id, assignedLawyerId: user.id, title, internalFileNumber: `SYNTHETIC-${randomUUID()}`, caseType: "Civil", courtName: "Synthetic court", nextSessionAt: new Date("2027-01-12T10:00:00Z"), sessions: { create: { createdById: user.id, sessionDate: new Date("2026-10-20T10:00:00Z"), decision: "Synthetic adjournment", nextAction: "Provide a copy of the contract" } } } });
      await fixture.db.payment.create({ data: { clientId: client.id, invoiceNumber: `SYNTHETIC-${randomUUID()}`, issueDate: new Date(), amount: "250", currency: "EGP", status: "ISSUED" } });
      const token = await createAssistantSession("ar", actor);
      const identity = { capabilityHash: capabilityHash(token) };
      await fixture.db.assistantSession.update({ where: identity, data: { dialogue: { followup: { category: "SERVICE_REQUEST", selected: { kind: "SERVICE_REQUEST", id: service.id } } } } });
      if (scenario.fault === "REVOKED_USER") await fixture.db.user.update({ where: { id: actor.id }, data: { status: "SUSPENDED" } });
      if (scenario.fault === "EXPIRED_SESSION") await fixture.db.assistantSession.update({ where: identity, data: { expiresAt: new Date(0) } });
      let providerCalls = 0, cost = 0, costComplete = true, invalidInjected = false;
      const elapsed: number[] = [], turns: unknown[] = [], errors: string[] = [];
      const stages: unknown[] = [];
      vi.stubGlobal("fetch", async (url: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)), name = body.tools?.[0]?.function?.name;
        const search = body.tools?.[0]?.type === "openrouter:web_search";
        if (search && scenario.fault === "SEARCH_UNAVAILABLE") return new Response("synthetic", { status: 503 });
        if (search && scenario.fault === "SEARCH_NO_EXCERPTS") return Response.json({ choices: [{ message: { annotations: [{ type: "url_citation", url_citation: { title: "No excerpt", url: "https://cc.gov.eg/" } }] } }] });
        if (name === "compose_legal_reply" && (scenario.fault === "INVALID_OUTPUT_ALWAYS" || (scenario.fault === "INVALID_OUTPUT_ONCE" && !invalidInjected))) { invalidInjected = true; return Response.json({ choices: [] }); }
        if (scenario.fault === "PROVIDER_CREDIT") return new Response("synthetic", { status: 402 });
        if (scenario.fault === "PROVIDER_TIMEOUT") return new Promise<Response>((_resolve, reject) => { init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }); });
        providerCalls++;
        const response = await nativeFetch(url, init);
        const data = await response.clone().json().catch(() => null);
        // Synthetic tool outputs and public excerpts only; never save hidden reasoning or headers.
        stages.push({ operation: search ? "research" : name, status: response.status, finishReason: data?.choices?.[0]?.finish_reason,
          results: data?.choices?.[0]?.message?.tool_calls?.map((c: { function?: { name?: string; arguments?: string } }) => ({ name: c.function?.name, arguments: c.function?.arguments?.slice(0, 12000) })),
          annotations: search ? data?.choices?.[0]?.message?.annotations : undefined });
        if (typeof data?.usage?.cost === "number") cost += data.usage.cost; else costComplete = false;
        return response;
      });
      if (scenario.fault === "PROVIDER_TIMEOUT") vi.stubEnv("AI_TIMEOUT_MS", "1000");
      for (const [index, message] of scenario.messages.entries()) {
        const messageId = randomUUID(), started = performance.now();
        try {
          if (scenario.fault === "REOPEN_72H" && index > 0) {
            // Timestamp reconstruction checks persisted reads, not an elapsed 72-hour soak.
            await fixture.db.assistantTurn.updateMany({ where: { session: identity }, data: { createdAt: new Date(Date.now() - 72 * 3600_000) } });
            await readAssistantSession(token, actor);
          }
          const input = { token, actor, messageId, message, locale: "ar" as const, requestId: randomUUID() };
          const state = await sendAssistantMessage(input);
          if (scenario.fault === "DUPLICATE_MESSAGE") expect((await sendAssistantMessage(input)).turns.length).toBe(state.turns.length);
          turns.push({ question: message, answer: state.turns.at(-1)?.assistantText, sources: state.turns.at(-1)?.sources, proposals: state.proposals });
          expect(await fixture.db.assistantActionProposal.count({ where: { session: identity, status: "COMPLETED" } })).toBe(0);
        } catch (error) { errors.push(error && typeof error === "object" && "code" in error ? String(error.code) : "ASSERTION_OR_RUNTIME_FAILURE"); }
        elapsed.push(Math.round(performance.now() - started));
      }
      const record = { version: evaluationVersion, sourceHash, model, route: routes[model], repetition, scenario: scenario.id, holdout: scenario.holdout, group: scenario.group, fault: scenario.fault, providerCalls, elapsed, costUsd: costComplete ? cost : null, turns, errors, stages, semanticReview: "NOT_VERIFIED", legalReview: "NOT_VERIFIED", elapsedSoak: "NOT_VERIFIED" };
      const filename = `${model.replaceAll("/", "_")}-${repetition}-${scenario.id}.json`;
      await writeFile(`${directory}/${filename}`, JSON.stringify(record, null, 2));
      await writeFile(`${directory}/${filename}.sha256`, createHash("sha256").update(JSON.stringify(record, null, 2)).digest("hex"));
      if (canary) canaryResults.push({ scenario: scenario.id, errors, elapsed, costUsd: record.costUsd });
    }
  }
  if (canary) {
    const passed = canaryResults.length === 6 && canaryResults.every(r => !r.errors.length && r.elapsed.every(ms => ms <= 60_000));
    await writeFile(`${directory}/canary.json`, JSON.stringify({ sourceHash, models, checkedAt: new Date().toISOString(), results: canaryResults, mechanical: passed ? "PASS" : "FAIL", semantic: "NOT_VERIFIED", deployedBehavior: "NOT_VERIFIED", productionAccepted: false }, null, 2));
    expect(passed, "Synthetic canary failed; inspect results before any promotion").toBe(true);
  }
}, 12 * 60 * 60_000);
