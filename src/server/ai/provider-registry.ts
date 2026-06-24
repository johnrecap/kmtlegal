import { getAIProviderConfig, type AIProviderConfig } from "./config";
import type { AIProviderAdapter } from "./types";
import { createMockAIProvider } from "./providers/mock";
import { createOpenAICompatibleProvider } from "./providers/openai-compatible";

export function getAIProvider(config: AIProviderConfig = getAIProviderConfig()): AIProviderAdapter {
  if (config.provider === "mock") {
    return createMockAIProvider();
  }

  return createOpenAICompatibleProvider(config, config.provider);
}
