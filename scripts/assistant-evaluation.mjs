import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";

const canary = process.argv.includes("--canary");
const representative = process.argv.includes("--representative");
const output = path.resolve(process.env.ASSISTANT_EVALUATION_OUTPUT || (canary ? `_workspace/assistant-canary/${new Date().toISOString().replaceAll(":", "-")}` : "_workspace/assistant-evaluation"));
const envPath = process.env.KMT_LIVE_AI_ENV_FILE || ".env";
let settings = {};
try { settings = parseEnv(await readFile(envPath, "utf8")); } catch { /* Report configuration failure without file contents. */ }
// Owner selected DeepSeek for cost. Other models require an explicit opt-in.
const compare = process.argv.includes("--compare-models");
const candidates = compare ? ["deepseek/deepseek-v4.1-flash", "openai/gpt-6.1-sol", "anthropic/claude-sonnet-5.5"] : ["deepseek/deepseek-v4.1-flash"];
const selectedModel = process.env.ASSISTANT_EVALUATION_MODEL || settings.AI_MODEL || candidates[0];
const models = canary || representative ? [selectedModel] : candidates;
let routes = {};
try { routes = JSON.parse(settings.AI_EVALUATION_ROUTES || "{}"); } catch { /* Invalid routing blocks a run. */ }
const configured = settings.AI_PROVIDER === "openrouter" && !!settings.AI_API_KEY;
const routingReady = models.every(model => Array.isArray(routes[model]) && routes[model].length === 1 && typeof routes[model][0] === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_./ -]{0,99}$/.test(routes[model][0]));
const source = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout?.trim() || null;
const corpusHash = createHash("sha256").update(await readFile("tests/fixtures/assistant-evaluation.ts")).digest("hex");
await mkdir(output, { recursive: true });
const preflight = { status: !configured ? "BLOCKED_CONFIGURATION" : !routingReady ? "BLOCKED_UNPINNED_ROUTES" : "READY_TO_EVALUATE", source, corpusHash, models, repeats: canary || representative ? 1 : 3, scenarioCount: representative ? 1 : canary ? 6 : 60, holdoutCount: canary || representative ? 0 : 20, syntheticOnly: true, actualProviderTested: false, productionAccepted: false };
await writeFile(path.join(output, "preflight.json"), JSON.stringify(preflight, null, 2));
console.log(JSON.stringify(preflight, null, 2));
if (!process.argv.includes("--run")) process.exit(0);
if (!configured || !routingReady) process.exit(2);
// The fixture reads only AI keys, never DATABASE_URL/auth/mail from the provider env file.
const child = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/server/assistant-model-evaluation.test.ts", "--maxWorkers=1"], {
  stdio: "inherit", env: { ...process.env, RUN_ASSISTANT_MATRIX: "true", ASSISTANT_COMPARE_MODELS: compare ? "true" : "false", ASSISTANT_REPRESENTATIVE: representative ? "true" : "false", ASSISTANT_CANARY: canary ? "true" : "false", KMT_LIVE_AI_ENV_FILE: path.resolve(envPath), ASSISTANT_EVALUATION_OUTPUT: output }
});
process.exit(child.status ?? 1);
