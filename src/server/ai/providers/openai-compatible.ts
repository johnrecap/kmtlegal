import { ApiError } from "@/server/http/errors";
import type { AIProviderAdapter, AIProviderName, AIProviderResult } from "../types";
import type { AIProviderConfig } from "../config";

export function createOpenAICompatibleProvider(config: AIProviderConfig, name: AIProviderName): AIProviderAdapter {
  return {
    name,
    async generate(input): Promise<AIProviderResult> {
      if (!config.baseUrl) {
        throw new ApiError(500, "AI_PROVIDER_UNAVAILABLE", "AI provider base URL is not configured.");
      }

      if (!config.apiKey && name !== "local") {
        throw new ApiError(500, "AI_PROVIDER_UNAVAILABLE", "AI provider API key is not configured.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
          },
          body: JSON.stringify({
            model: config.model,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
            messages: [
              {
                role: "system",
                content:
                  "Return strict JSON only. Do not provide final legal advice. Mark all output as requiring lawyer review."
              },
              {
                role: "user",
                content: JSON.stringify({
                  task: input.task,
                  locale: input.locale,
                  safetyPolicy: input.safetyPolicy,
                  input: input.input
                })
              }
            ]
          })
        });

        if (!response.ok) {
          throw new ApiError(502, "AI_PROVIDER_UNAVAILABLE", "AI provider request failed.");
        }

        const payload = (await response.json()) as OpenAICompatibleResponse;
        const content = payload.choices?.[0]?.message?.content;
        if (!content) {
          throw new ApiError(502, "AI_OUTPUT_INVALID", "AI provider response did not include content.");
        }

        return {
          provider: name,
          model: payload.model ?? config.model,
          task: input.task,
          output: parseJsonContent(content),
          usage: payload.usage
            ? {
                inputTokens: payload.usage.prompt_tokens,
                outputTokens: payload.usage.completion_tokens,
                totalTokens: payload.usage.total_tokens
              }
            : undefined
        };
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new ApiError(504, "AI_PROVIDER_TIMEOUT", "AI provider timed out.");
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

type OpenAICompatibleResponse = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function parseJsonContent(content: string) {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(withoutFence);
}
