import { DEFAULT_OPENROUTER_MODEL, type AIProviderConfig } from "../config";

export function providerRequestParameters(config: AIProviderConfig) {
  if (config.provider !== "openrouter") return {};

  return {
    provider: { require_parameters: true },
    // Disabling reasoning preserves the small response budget for visible text and tool arguments.
    ...(config.model === DEFAULT_OPENROUTER_MODEL ? { reasoning: { enabled: false } } : {})
  };
}
