import { z } from "zod";
import { ApiError } from "@/server/http/errors";
import { getAIProviderConfig } from "./config";
import { getAIProvider } from "./provider-registry";
import { assertNoFinalLegalAdviceText } from "./safety";
import type { AIChatMessage, AIProviderAdapter } from "./types";

export type ConversationTool = {
  description: string;
  schema: z.ZodType;
  /** Recheck session ownership and human takeover here, immediately before any side effect. */
  execute: (argumentsValue: unknown, callId: string) => Promise<unknown>;
};

/** One bounded turn, supplied exclusively with server-owned state and tool implementations. */
export async function runConversationTurn(input: {
  messages: AIChatMessage[];
  tools: Record<string, ConversationTool>;
  requestId: string;
  assertActive: () => Promise<void>;
  provider?: AIProviderAdapter;
  signal?: AbortSignal;
}) {
  const config = getAIProviderConfig();
  const provider = input.provider ?? getAIProvider(config);
  if (!provider.chat) throw new ApiError(503, "AI_PROVIDER_UNAVAILABLE", "Conversational AI provider is not configured.");
  if (input.messages.length > 80 || JSON.stringify(input.messages).length > 64_000) {
    throw new ApiError(400, "VALIDATION_ERROR", "Conversation context limit reached.");
  }
  const tools = Object.entries(input.tools).map(([name, tool]) => ({
    type: "function" as const,
    function: {
      name, description: tool.description,
      parameters: z.toJSONSchema(tool.schema, { target: "draft-07", io: "input" }) as Record<string, unknown>
    }
  }));
  const messages = [...input.messages];
  const additions: AIChatMessage[] = [];
  const signal = input.signal ?? AbortSignal.timeout(config.timeoutMs);
  let toolCount = 0;
  const callIds = new Set<string>();
  // At most four provider calls and six server actions. No unbounded agent loop or automatic retry of mutations.
  for (let round = 0; round < 4; round += 1) {
    await input.assertActive();
    if (signal.aborted) throw new ApiError(504, "AI_PROVIDER_TIMEOUT", "AI provider timed out.");
    const result = await provider.chat({ messages, tools, requestId: input.requestId, signal });
    await input.assertActive();
    const calls = result.message.tool_calls ?? [];
    if (!calls.length) {
      const text = result.message.content?.trim();
      if (!text || !assertNoFinalLegalAdviceText("consultation_assistant", { message: text })) {
        throw new ApiError(502, "AI_OUTPUT_INVALID", "AI provider output failed safety validation.");
      }
      additions.push({ role: "assistant", content: text });
      return { text, additions };
    }
    if (round === 3 || toolCount + calls.length > 6) {
      throw new ApiError(502, "AI_OUTPUT_INVALID", "Conversation action limit reached.");
    }
    // Validate the complete batch before invoking any action, including unexpected names/properties.
    const validated = calls.map(call => {
      if (callIds.has(call.id) || !Object.hasOwn(input.tools, call.function.name)) {
        throw new ApiError(502, "AI_OUTPUT_INVALID", "AI requested an unsupported action.");
      }
      callIds.add(call.id);
      const tool = input.tools[call.function.name];
      let argumentsValue: unknown;
      try { argumentsValue = JSON.parse(call.function.arguments); } catch {
        throw new ApiError(502, "AI_OUTPUT_INVALID", "AI action arguments are invalid.");
      }
      const parsed = tool.schema.safeParse(argumentsValue);
      if (!parsed.success) throw new ApiError(502, "AI_OUTPUT_INVALID", "AI action arguments are invalid.");
      return { call, tool, argumentsValue: parsed.data };
    });
    // Discard unverified prose accompanying a tool request; only speak after authoritative tool results.
    const requestMessage: AIChatMessage = { role: "assistant", content: null, tool_calls: calls };
    messages.push(requestMessage);
    additions.push(requestMessage);
    for (const { call, tool, argumentsValue } of validated) {
      await input.assertActive();
      if (signal.aborted) throw new ApiError(504, "AI_PROVIDER_TIMEOUT", "AI provider timed out.");
      const value = await tool.execute(argumentsValue, call.id);
      const serialized = JSON.stringify(value ?? null);
      if (serialized.length > 20_000) throw new ApiError(502, "AI_OUTPUT_INVALID", "AI action result exceeds the context limit.");
      const toolMessage: AIChatMessage = { role: "tool", tool_call_id: call.id, content: serialized };
      messages.push(toolMessage);
      additions.push(toolMessage);
      toolCount += 1;
    }
  }
  throw new ApiError(502, "AI_OUTPUT_INVALID", "Conversation action limit reached.");
}
