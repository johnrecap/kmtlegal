import { DEFAULT_OPENROUTER_MODEL, type AIProviderConfig } from "../config";

function isOpenRouterDeepSeek(config: AIProviderConfig) {
  return config.provider === "openrouter" && config.model === DEFAULT_OPENROUTER_MODEL;
}
function isReasoningCandidate(config: AIProviderConfig) {
  return config.provider === "openrouter" && ["openai/gpt-6.1-sol", "anthropic/claude-sonnet-5.5"].includes(config.model);
}

export function providerRequestParameters(config: AIProviderConfig) {
  if (config.provider !== "openrouter") return {};

  return {
    provider: { require_parameters: true, ...(config.providerOnly?.length ? { only: config.providerOnly, allow_fallbacks: false } : {}) },
    // Disabling reasoning preserves the small response budget for visible text and tool arguments.
    ...(isOpenRouterDeepSeek(config) ? { reasoning: { enabled: false } } : {}),
    // These candidates do not advertise temperature support. Preserve their reasoning mode.
    ...(isReasoningCandidate(config) ? { temperature: undefined, reasoning: { effort: "low" } } : {})
  };
}

export function conversationRequestParameters(config: AIProviderConfig) {
  return {
    ...providerRequestParameters(config),
    // Sonnet 5.5 rejects forced calls even with thinking disabled. The caller still
    // requires the expected tool and validates its arguments before using output.
    ...(config.provider === "openrouter" && config.model === "anthropic/claude-sonnet-5.5" ? { tool_choice: "auto" } : {}),
    // This optional flag excludes DeepSeek endpoints under strict OpenRouter routing.
    // The conversation gateway still validates the whole batch and executes tools sequentially.
    ...(isOpenRouterDeepSeek(config) || isReasoningCandidate(config) ? {} : { parallel_tool_calls: false })
  };
}
