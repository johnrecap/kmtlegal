import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { vi } from "vitest";
import { getAIProviderConfig } from "@/server/ai/config";

// Import only provider settings. Production database/auth/mail settings never enter the fixture.
export const liveAIKeys = ["AI_PROVIDER", "AI_API_KEY", "AI_BASE_URL", "AI_MODEL", "AI_TIMEOUT_MS", "AI_CONVERSATION_TIMEOUT_MS", "AI_MAX_TOKENS", "AI_TEMPERATURE", "AI_STRUCTURED_OUTPUTS"] as const;
export async function liveAssistantEvaluation(nativeFetch: typeof fetch, directory: string) {
  const env = parseEnv(await readFile(process.env.KMT_LIVE_AI_ENV_FILE || ".env", "utf8"));
  for (const key of liveAIKeys) vi.stubEnv(key, env[key] ?? "");
  const config = getAIProviderConfig();
  let requests = 0;
  vi.stubGlobal("fetch", ((...args: Parameters<typeof fetch>) => { requests++; return nativeFetch(...args); }) as typeof fetch);
  const configured = config.provider === "openrouter" && !!config.apiKey && !!config.baseUrl;
  return {
    requireConfigured() { if (!configured) throw new Error("LIVE_PROVIDER_CONFIGURATION_REQUIRED"); },
    requestCount: () => requests,
    async report(passed: boolean, cases: unknown, failure?: unknown) {
      const code = typeof failure === "object" && failure && "code" in failure && typeof failure.code === "string" && /^[A-Z][A-Z0-9_]{1,79}$/.test(failure.code) ? failure.code : null;
      await mkdir(directory, { recursive: true });
      await writeFile(`${directory}/live-provider.json`, JSON.stringify({
        status: !configured ? "BLOCKED_CONFIGURATION" : passed && requests > 0 ? "PASS_ASSERTIONS_REQUIRES_SEMANTIC_REVIEW" : "FAILED",
        provider: config.provider, model: config.model, callTimeoutMs: config.timeoutMs,
        conversationTimeoutMs: config.conversationTimeoutMs, maxTokens: config.maxTokens,
        structuredOutputs: config.structuredOutputs, syntheticOnly: true, providerRequests: requests,
        failureCode: code, cases, semanticAcceptance: "Review current answers and official source support separately; no production or owner acceptance."
      }, null, 2));
    }
  };
}
