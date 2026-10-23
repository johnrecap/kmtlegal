import { z } from "zod";
import { ApiError } from "@/server/http/errors";
import { safeLog } from "@/server/observability/safe-log";
import type { AIProviderConfig } from "../config";
import type { AIChatInput, AIChatReply } from "../types";
import { conversationRequestParameters } from "./request-parameters";
import { readBoundedAIResponse } from "./bounded-response";

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
    total_tokens: z.number().int().nonnegative().optional(),
    cost: z.number().nonnegative().optional()
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
  const startedAt = performance.now();
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST", signal,
      headers: { "Content-Type": "application/json", ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}) },
      body: JSON.stringify({
        model: config.model, temperature: config.temperature, max_tokens: input.maxTokens ? Math.min(8000, Math.max(100, input.maxTokens)) : config.maxTokens,
        messages: input.messages, tools: input.tools, tool_choice: input.toolChoice ?? "auto",
        ...conversationRequestParameters(config)
      })
    });
    if (!response.ok) {
      safeLog("warn", "ai.provider_request_failed", {
        provider: config.provider, model: config.model,
        ...(/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(input.requestId) ? { requestId: input.requestId } : {}),
        diagnosticKind: "provider", status: response.status,
        elapsedMs: Math.round(performance.now() - startedAt), callTimeoutMs: config.timeoutMs
      });
      throw new ApiError(502, "AI_PROVIDER_UNAVAILABLE", "AI provider request failed.");
    }
    const value = await readBoundedAIResponse(response);
    const parsed = responseSchema.safeParse(value);
    if (!parsed.success) throw new ApiError(502, "AI_OUTPUT_INVALID", "AI provider response is invalid.");
    const reply = parsed.data.choices[0];
    safeLog("info", "assistant.provider_usage", { requestId: input.requestId, model: config.model, provider: config.provider, inputCount: parsed.data.usage?.prompt_tokens, outputCount: parsed.data.usage?.completion_tokens, costUsd: parsed.data.usage?.cost, elapsedMs: Math.round(performance.now() - startedAt), policyVersion: "kmt-legal-20261023" });
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
    if (signal.aborted) throw new ApiError(504, "AI_PROVIDER_TIMEOUT", "AI provider timed out.");
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "AI_PROVIDER_UNAVAILABLE", "AI provider request failed.");
  }
}
