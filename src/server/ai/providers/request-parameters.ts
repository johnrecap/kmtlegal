import { DEFAULT_OPENROUTER_MODEL, type AIProviderConfig } from "../config";

function isOpenRouterDeepSeek(config: AIProviderConfig) {
  return config.provider === "openrouter" && config.model === DEFAULT_OPENROUTER_MODEL;
}

export function providerRequestParameters(config: AIProviderConfig) {
  if (config.provider !== "openrouter") return {};

  return {
    provider: { require_parameters: true },
    // Disabling reasoning preserves the small response budget for visible text and tool arguments.
    ...(isOpenRouterDeepSeek(config) ? { reasoning: { enabled: false } } : {})
  };
}

export function conversationRequestParameters(config: AIProviderConfig) {
  return {
    ...providerRequestParameters(config),
    // This optional flag excludes DeepSeek endpoints under strict OpenRouter routing.
    // The conversation gateway still validates the whole batch and executes tools sequentially.
    ...(isOpenRouterDeepSeek(config) ? {} : { parallel_tool_calls: false })
  };
}
