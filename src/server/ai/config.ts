import type { AIProviderName } from "./types";

export type AIProviderConfig = {
  provider: AIProviderName;
  baseUrl?: string;
  apiKey?: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
};

export function getAIProviderConfig(): AIProviderConfig {
  const provider = normalizeProvider(process.env.AI_PROVIDER);

  return {
    provider,
    baseUrl: process.env.AI_BASE_URL || defaultBaseUrlForProvider(provider),
    apiKey: process.env.AI_API_KEY || undefined,
    model: process.env.AI_MODEL || defaultModelForProvider(provider),
    timeoutMs: numberFromEnv("AI_TIMEOUT_MS", 30_000),
    maxTokens: numberFromEnv("AI_MAX_TOKENS", 1200),
    temperature: numberFromEnv("AI_TEMPERATURE", 0.2)
  };
}

function normalizeProvider(value: string | undefined): AIProviderName {
  if (value === "openrouter" || value === "openai-compatible" || value === "local" || value === "custom") {
    return value;
  }

  return "mock";
}

function numberFromEnv(key: string, fallback: number) {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function defaultBaseUrlForProvider(provider: AIProviderName) {
  if (provider === "openrouter") {
    return "https://openrouter.ai/api/v1";
  }

  return undefined;
}

function defaultModelForProvider(provider: AIProviderName) {
  return provider === "mock" ? "mock-kmt-legal-v1" : "configured-model";
}
