import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { getAIProviderConfig, type AIProviderConfig } from "@/server/ai/config";
import { requestConversation } from "@/server/ai/providers/conversational";
import { getAIProvider } from "@/server/ai/provider-registry";
import { runConversationTurn } from "@/server/ai/conversation-gateway";
import { boundedConversationProvider, INPUT_POLICY, OUTPUT_POLICY, messageAssessmentSchema, policyDecision, replyReviewSchema } from "@/server/ai/company-conversation-policy";

const config: AIProviderConfig = {
  provider: "openrouter", model: "deepseek/deepseek-v4.1-flash", baseUrl: "https://provider.test/v1",
  apiKey: "fixture-key", timeoutMs: 30_000, maxTokens: 1200, temperature: 0.2
};
const structuredInput = {
  task: "intake_summary" as const, locale: "ar" as const, input: { message: "طلب تجريبي" },
  outputSchema: z.strictObject({ summary: z.string() }),
  safetyPolicy: { requireHumanReview: true, prohibitLegalAdvice: true, redactBeforeLogging: true }, requestId: "fixture"
};
const textResponse = (content: string) => Response.json({ choices: [{ finish_reason: "stop", message: { content } }] });
const toolResponse = (name: string, args: unknown, id = name) => Response.json({ choices: [{
  finish_reason: "tool_calls", message: { content: null, tool_calls: [{
    id, type: "function", function: { name, arguments: JSON.stringify(args) }
  }] }
}] });

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("OpenRouter DeepSeek request profile", () => {
  it("routes DeepSeek without the incompatible parallel-tool parameter and keeps reasoning disabled", async () => {
    vi.stubEnv("AI_PROVIDER", "openrouter");
    vi.stubEnv("AI_MODEL", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_API_KEY", "fixture-key");
    // Reproduce the observed routing rejection at the network boundary.
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const payload = JSON.parse(String(init.body));
      if (Object.hasOwn(payload, "parallel_tool_calls")) {
        return Response.json({ error: { message: "No compatible endpoints" } }, { status: 404 });
      }
      return toolResponse("diagnostic", { ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);

    const reply = await requestConversation(getAIProviderConfig(), {
      messages: [{ role: "user", content: "Call diagnostic with ok=true." }],
      tools: [{ type: "function", function: { name: "diagnostic", description: "Synthetic test only.", parameters: {
        type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false
      } } }], requestId: "fixture"
    });
    expect(reply.message.tool_calls?.[0].function.name).toBe("diagnostic");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "deepseek/deepseek-v4.1-flash", reasoning: { enabled: false },
      provider: { require_parameters: true }
    });
    expect(JSON.parse(String(init.body))).not.toHaveProperty("parallel_tool_calls");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["off", "json_schema"] as const)("disables reasoning and retains parsed output with structured outputs %s", async structuredOutputs => {
    const fetchMock = vi.fn(async () => textResponse(JSON.stringify({ summary: "طلب تجريبي" })));
    vi.stubGlobal("fetch", fetchMock);
    const reply = await getAIProvider({ ...config, structuredOutputs }).generate(structuredInput);
    expect(reply.output).toEqual({ summary: "طلب تجريبي" });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const payload = JSON.parse(String(init.body));
    expect(payload).toMatchObject({ model: config.model, reasoning: { enabled: false }, provider: { require_parameters: true } });
    expect(payload).not.toHaveProperty("parallel_tool_calls");
    if (structuredOutputs === "json_schema") {
      expect(payload.response_format).toMatchObject({ type: "json_schema", json_schema: { strict: true } });
    } else {
      expect(payload).not.toHaveProperty("response_format");
    }
  });

  it.each([
    { provider: "openrouter", model: "google/gemini-2.5-flash" },
    { provider: "openrouter", model: "deepseek/deepseek-v4.1-flash:batch" },
    { provider: "openai-compatible", model: "deepseek/deepseek-v4.1-flash" },
    { provider: "custom", model: "deepseek/deepseek-v4.1-flash" },
    { provider: "local", model: "deepseek/deepseek-v4.1-flash" }
  ] as const)("leaves reasoning unspecified for $provider / $model in both request paths", async override => {
    const fetchMock = vi.fn(async () => textResponse('{"summary":"fixture"}'));
    vi.stubGlobal("fetch", fetchMock);
    const provider = getAIProvider({ ...config, ...override });
    await provider.chat!({ messages: [{ role: "user", content: "fixture" }], tools: [], requestId: "fixture" });
    await provider.generate(structuredInput);
    expect(JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body)).parallel_tool_calls).toBe(false);
    expect(JSON.parse(String((fetchMock.mock.calls[1] as unknown as [string, RequestInit])[1].body))).not.toHaveProperty("parallel_tool_calls");
    for (const call of fetchMock.mock.calls) {
      const [, init] = call as unknown as [string, RequestInit];
      const payload = JSON.parse(String(init.body));
      expect(payload.model).toBe(override.model);
      expect(payload).not.toHaveProperty("reasoning");
      if (override.provider === "openrouter") expect(payload.provider).toEqual({ require_parameters: true });
      else expect(payload).not.toHaveProperty("provider");
    }
  });

  it.each(["success", "provider failure", "repeated tool ID"])("keeps reasoning off across a policy/tool turn with %s and never repeats its write", async outcome => {
    const assessment = { scope: "OFFICE", intent: "BOOK", evidence: "احجز", locale: "ar", offerAppropriate: false, inScopeQuestion: "احجز" };
    const review = { inScope: true, grounded: true, noPrematureContact: true, noBookingPressure: true, noFinalLegalAdvice: true, noFalseActionClaim: true };
    const payloads: unknown[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      const payload = JSON.parse(String(init.body));
      payloads.push(payload);
      const toolName = payload.tools[0].function.name;
      if (toolName === "classify_company_message") return toolResponse(toolName, assessment);
      if (toolName === "review_company_reply") return toolResponse(toolName, review);
      if (payload.messages.some((message: { role: string }) => message.role === "tool")) {
        if (outcome === "provider failure") return new Response("upstream failure", { status: 503 });
        if (outcome === "success") return textResponse("مرجع الطلب التجريبي TEST-BOOKING");
      }
      return toolResponse("submit_request", { slotId: "fixture-slot" }, "write-once");
    }));
    const assertActive = vi.fn(async () => {});
    const signal = AbortSignal.timeout(30_000);
    const provider = boundedConversationProvider(getAIProvider(config), signal, assertActive);
    expect(await policyDecision(provider, messageAssessmentSchema, "classify_company_message", INPUT_POLICY, { message: "احجز" }, "fixture")).toEqual(assessment);

    const execute = vi.fn(async () => ({ reference: "TEST-BOOKING" }));
    const turn = runConversationTurn({
      provider, signal, assertActive, requestId: "fixture", messages: [{ role: "user", content: "احجز" }],
      tools: { submit_request: { description: "Synthetic booking write", schema: z.strictObject({ slotId: z.literal("fixture-slot") }), execute } }
    });
    if (outcome === "success") {
      const reply = await turn;
      expect(reply.text).toContain("TEST-BOOKING");
      expect(reply.additions.map(message => message.role)).toEqual(["assistant", "tool", "assistant"]);
      expect(await policyDecision(provider, replyReviewSchema, "review_company_reply", OUTPUT_POLICY, { reply: reply.text }, "fixture")).toEqual(review);
    } else {
      await expect(turn).rejects.toMatchObject({ code: outcome === "provider failure" ? "AI_PROVIDER_UNAVAILABLE" : "AI_OUTPUT_INVALID" });
    }
    expect(execute).toHaveBeenCalledExactlyOnceWith({ slotId: "fixture-slot" }, "write-once");
    for (const payload of payloads) {
      expect(payload).toMatchObject({ model: config.model, reasoning: { enabled: false }, provider: { require_parameters: true } });
      expect(payload).not.toHaveProperty("parallel_tool_calls");
    }
  });

  it.each([404, 429, 503])("logs only safe HTTP diagnostics for status %s without retrying", async status => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn(async () => Response.json({ error: { message: "private upstream body and fixture-key" } }, { status }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(requestConversation(config, {
      messages: [{ role: "user", content: "private client prompt" }], tools: [], requestId: "safe-correlation"
    })).rejects.toMatchObject({ code: "AI_PROVIDER_UNAVAILABLE", message: "AI provider request failed." });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0][0]);
    expect(JSON.parse(line)).toMatchObject({ event: "ai.provider_request_failed" });
    expect(JSON.parse(line).metadata).toEqual({
      provider: config.provider, model: config.model, requestId: "safe-correlation", diagnosticKind: "provider", status
    });
    expect(line).not.toMatch(/fixture-key|private upstream|private client/);
  });

  it("rejects a missing key before either request path reaches the network", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const provider = getAIProvider({ ...config, apiKey: undefined });
    await expect(provider.chat!({ messages: [], tools: [], requestId: "fixture" })).rejects.toMatchObject({ code: "AI_PROVIDER_UNAVAILABLE" });
    await expect(provider.generate(structuredInput)).rejects.toMatchObject({ code: "AI_PROVIDER_UNAVAILABLE" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
