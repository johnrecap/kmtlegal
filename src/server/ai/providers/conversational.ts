import { z } from "zod";
import { ApiError } from "@/server/http/errors";
import type { AIProviderConfig } from "../config";
import type { AIChatInput, AIChatReply } from "../types";

const callSchema = z.object({
  id: z.string().min(1).max(160),
  type: z.literal("function"),
  function: z.object({ name: z.string().regex(/^[a-z_]{1,64}$/), arguments: z.string().max(12_000) })
});
const responseSchema = z.object({
  choices: z.array(z.object({
    finish_reason: z.enum(["stop", "tool_calls"]),
    message: z.object({
      content: z.string().max(12_000).nullable().optional(),
      tool_calls: z.array(callSchema).max(6).optional()
    })
  })).min(1),
  usage: z.object({
    prompt_tokens: z.number().int().nonnegative().optional(),
    completion_tokens: z.number().int().nonnegative().optional(),
    total_tokens: z.number().int().nonnegative().optional()
  }).optional()
});

/** Same configured provider and credentials as structured generation, with tool protocol support. */
export async function requestConversation(config: AIProviderConfig, input: AIChatInput): Promise<AIChatReply> {
  if (!config.baseUrl || (!config.apiKey && config.provider !== "local")) {
    throw new ApiError(503, "AI_PROVIDER_UNAVAILABLE", "AI provider is not configured.");
  }
  const signal = input.signal
    ? AbortSignal.any([input.signal, AbortSignal.timeout(config.timeoutMs)])
    : AbortSignal.timeout(config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST", signal,
      headers: { "Content-Type": "application/json", ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}) },
      body: JSON.stringify({
        model: config.model, temperature: config.temperature, max_tokens: config.maxTokens,
        messages: input.messages, tools: input.tools, tool_choice: "auto", parallel_tool_calls: false,
        ...(config.provider === "openrouter" ? { provider: { require_parameters: true } } : {})
      })
    });
    if (!response.ok) throw new ApiError(502, "AI_PROVIDER_UNAVAILABLE", "AI provider request failed.");
    // Bound response size before parsing; do not include provider body or customer content in diagnostics.
    const reader = response.body?.getReader();
    if (!reader) throw new ApiError(502, "AI_OUTPUT_INVALID", "AI provider response is invalid.");
    let raw = "";
    let bytes = 0;
    const decoder = new TextDecoder();
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > 131_072) {
          await reader.cancel();
          throw new ApiError(502, "AI_OUTPUT_INVALID", "AI provider response is invalid.");
        }
        raw += decoder.decode(part.value, { stream: true });
      }
      raw += decoder.decode();
    } finally { reader.releaseLock(); }
    let value: unknown;
    try { value = JSON.parse(raw); } catch { throw new ApiError(502, "AI_OUTPUT_INVALID", "AI provider response is invalid."); }
    const parsed = responseSchema.safeParse(value);
    if (!parsed.success) throw new ApiError(502, "AI_OUTPUT_INVALID", "AI provider response is invalid.");
    const reply = parsed.data.choices[0];
    const calls = reply.message.tool_calls;
    if ((!calls?.length && !reply.message.content?.trim()) ||
      (reply.finish_reason === "tool_calls" && !calls?.length) ||
      (calls?.length && reply.finish_reason !== "tool_calls") ||
      (calls && new Set(calls.map(call => call.id)).size !== calls.length)) {
      throw new ApiError(502, "AI_OUTPUT_INVALID", "AI provider response is invalid.");
    }
    return {
      message: { role: "assistant", content: reply.message.content ?? null, ...(calls?.length ? { tool_calls: calls } : {}) },
      usage: parsed.data.usage ? {
        inputTokens: parsed.data.usage.prompt_tokens,
        outputTokens: parsed.data.usage.completion_tokens,
        totalTokens: parsed.data.usage.total_tokens
      } : undefined
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal.aborted) throw new ApiError(504, "AI_PROVIDER_TIMEOUT", "AI provider timed out.");
    throw new ApiError(502, "AI_PROVIDER_UNAVAILABLE", "AI provider request failed.");
  }
}
