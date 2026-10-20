import { afterEach, expect, it, vi } from "vitest";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { liveAssistantEvaluation } from "./helpers/live-assistant-evaluation";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("rejects a mock-only live evaluation before network access and records BLOCKED", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "kmt-live-eval-")), config = path.join(dir, "settings.env");
  await writeFile(config, "AI_PROVIDER=mock\n"); vi.stubEnv("KMT_LIVE_AI_ENV_FILE", config);
  const network = vi.fn<typeof fetch>(); const evaluation = await liveAssistantEvaluation(network, dir);
  expect(() => evaluation.requireConfigured()).toThrow("LIVE_PROVIDER_CONFIGURATION_REQUIRED");
  await evaluation.report(false, []);
  expect(network).not.toHaveBeenCalled();
  expect(JSON.parse(await readFile(path.join(dir, "live-provider.json"), "utf8"))).toMatchObject({ status: "BLOCKED_CONFIGURATION", providerRequests: 0, syntheticOnly: true });
});
it("imports only AI settings including the turn budget and never exports credentials or raw errors", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "kmt-live-eval-")), config = path.join(dir, "settings.env");
  await writeFile(config, "AI_PROVIDER=openrouter\nAI_API_KEY=synthetic-fixture-credential\nAI_CONVERSATION_TIMEOUT_MS=45000\nAI_STRUCTURED_OUTPUTS=json_schema\nDATABASE_URL=production-must-not-be-imported\nAUTH_SECRET=production-must-not-be-imported\n");
  vi.stubEnv("KMT_LIVE_AI_ENV_FILE", config); vi.stubEnv("DATABASE_URL", "synthetic-isolated"); vi.stubEnv("AUTH_SECRET", "synthetic-isolated");
  const network = vi.fn<typeof fetch>(); const evaluation = await liveAssistantEvaluation(network, dir);
  evaluation.requireConfigured();
  expect(process.env.DATABASE_URL).toBe("synthetic-isolated"); expect(process.env.AUTH_SECRET).toBe("synthetic-isolated");
  await evaluation.report(true, [], new Error("synthetic-fixture-credential"));
  const raw = await readFile(path.join(dir, "live-provider.json"), "utf8"), report = JSON.parse(raw);
  expect(report).toMatchObject({ status: "FAILED", providerRequests: 0, conversationTimeoutMs: 45000, structuredOutputs: "json_schema" });
  expect(raw).not.toContain("synthetic-fixture-credential"); expect(raw).not.toContain("production-must-not-be-imported");
});
