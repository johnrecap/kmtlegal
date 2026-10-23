import type { AIProviderName } from "./types";

export const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-v4.1-flash";

export type AIProviderConfig = {
  provider: AIProviderName;
  baseUrl?: string;
  apiKey?: string;
  model: string;
  timeoutMs: number;
  conversationTimeoutMs?: number;
  maxTokens: number;
  temperature: number;
  structuredOutputs?: "json_schema" | "off";
  providerOnly?: string[];
};

export function getAIProviderConfig(env: NodeJS.ProcessEnv = process.env): AIProviderConfig & { conversationTimeoutMs: number } {
  const provider = normalizeProvider(env.AI_PROVIDER);
  const boundedNumber = (key: string, fallback: number, minimum: number, maximum: number) => {
    const numeric = Number(env[key]);
    return Number.isFinite(numeric) && numeric >= minimum && numeric <= maximum ? numeric : fallback;
  };
  const turnTimeout = Number(env.AI_CONVERSATION_TIMEOUT_MS);
  const providerOnly = (env.AI_OPENROUTER_PROVIDERS ?? "").split(",").map(value => value.trim()).filter(Boolean);
  if (providerOnly.length > 5 || providerOnly.some(value => !/^[a-zA-Z0-9][a-zA-Z0-9_./ -]{0,99}$/.test(value))) throw new Error("Invalid OpenRouter provider routing configuration.");

  return {
    provider,
    baseUrl: env.AI_BASE_URL || defaultBaseUrlForProvider(provider),
    apiKey: env.AI_API_KEY || undefined,
    model: env.AI_MODEL || defaultModelForProvider(provider),
    timeoutMs: boundedNumber("AI_TIMEOUT_MS", 30_000, 1_000, 60_000),
    conversationTimeoutMs: Number.isInteger(turnTimeout) && turnTimeout >= 1000 && turnTimeout <= 60_000 ? turnTimeout : 60_000,
    maxTokens: Math.trunc(boundedNumber("AI_MAX_TOKENS", 1200, 100, 8_000)),
    temperature: boundedNumber("AI_TEMPERATURE", 0.2, 0, 2),
    structuredOutputs: env.AI_STRUCTURED_OUTPUTS === "json_schema" ? "json_schema" : "off",
    providerOnly
  };
}

function normalizeProvider(value: string | undefined): AIProviderName {
  if (value === "openrouter" || value === "openai-compatible" || value === "local" || value === "custom") {
    return value;
  }

  return "mock";
}

function defaultBaseUrlForProvider(provider: AIProviderName) {
  if (provider === "openrouter") {
    return "https://openrouter.ai/api/v1";
  }

  return undefined;
}

function defaultModelForProvider(provider: AIProviderName) {
  if (provider === "mock") {
    return "mock-kmt-legal-v1";
  }
  if (provider === "openrouter") {
    return DEFAULT_OPENROUTER_MODEL;
  }
  return "configured-model";
}
