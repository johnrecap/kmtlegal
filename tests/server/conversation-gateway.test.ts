import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { requestConversation } from "@/server/ai/providers/conversational";
import { runConversationTurn } from "@/server/ai/conversation-gateway";
import type { AIChatReply, AIProviderAdapter } from "@/server/ai/types";

const config = { provider: "openrouter" as const, baseUrl: "https://provider.test/v1", apiKey: "fixture", model: "fixture", timeoutMs: 1000, maxTokens: 300, temperature: 0.2 };
const call = (name = "slots", argumentsValue = "{}", id = "call1") => ({ role: "assistant" as const, content: null, tool_calls: [{ id, type: "function" as const, function: { name, arguments: argumentsValue } }] });
const answer = { role: "assistant" as const, content: "The office will review your requested time." };
const providerFor = (...replies: AIChatReply[]): AIProviderAdapter => ({ name: "mock", generate: vi.fn(), chat: vi.fn().mockImplementation(async () => replies.shift()) });
const base = () => ({ messages: [{ role: "user" as const, content: "Book a consultation" }], requestId: "fixture", assertActive: vi.fn(async () => {}), tools: { slots: { description: "Read available times", schema: z.strictObject({}), execute: vi.fn(async () => ({ slots: [] })) } } });

afterEach(() => vi.unstubAllGlobals());

describe("bounded conversational gateway", () => {
  it("round trips tools and context before answering", async () => {
    const input = base();
    const provider = providerFor({ message: call() }, { message: answer });
    const result = await runConversationTurn({ ...input, provider });
    expect(input.tools.slots.execute).toHaveBeenCalledExactlyOnceWith({}, "call1");
    expect(result.additions.map(message => message.role)).toEqual(["assistant", "tool", "assistant"]);
    expect(provider.chat).toHaveBeenLastCalledWith(expect.objectContaining({ messages: expect.arrayContaining([expect.objectContaining({ role: "tool", content: '{"slots":[]}' })]) }));
  });
  it.each([["delete_user", "{}"], ["slots", '{"userId":"other"}'], ["slots", "broken"], ["constructor", "{}"]])("rejects untrusted action %s before execution", async (name, args) => {
    const input = base();
    await expect(runConversationTurn({ ...input, provider: providerFor({ message: call(name, args) }) })).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
    expect(input.tools.slots.execute).not.toHaveBeenCalled();
  });
  it("halts before a mutation after human takeover during generation", async () => {
    const input = base();
    input.assertActive.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("human takeover"));
    await expect(runConversationTurn({ ...input, provider: providerFor({ message: call() }) })).rejects.toThrow("human takeover");
    expect(input.tools.slots.execute).not.toHaveBeenCalled();
  });
  it("rejects duplicate tool IDs without replaying side effects", async () => {
    const input = base();
    await expect(runConversationTurn({ ...input, provider: providerFor({ message: call() }, { message: call() }) })).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
    expect(input.tools.slots.execute).toHaveBeenCalledTimes(1);
  });
  it("bounds provider rounds and does not perform a final unanswerable action", async () => {
    const input = base();
    await expect(runConversationTurn({ ...input, provider: providerFor(...[1, 2, 3, 4].map(id => ({ message: call("slots", "{}", `c${id}`) }))) })).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
    expect(input.tools.slots.execute).toHaveBeenCalledTimes(3);
  });
  it("rejects a final guarantee", async () => {
    await expect(runConversationTurn({ ...base(), provider: providerFor({ message: { role: "assistant", content: "I guarantee you will win." } }) })).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
  });
  it("does not turn missing conversational provider support into scripted success", async () => {
    await expect(runConversationTurn({ ...base(), provider: { name: "mock", generate: vi.fn() } })).rejects.toMatchObject({ code: "AI_PROVIDER_UNAVAILABLE" });
  });
  it("preserves a provider failure without claiming success or retrying an action", async () => {
    const input = base();
    const provider = providerFor({ message: call() });
    vi.mocked(provider.chat!).mockRejectedValueOnce(new Error("unavailable"));
    await expect(runConversationTurn({ ...input, provider })).rejects.toThrow("unavailable");
    expect(input.tools.slots.execute).not.toHaveBeenCalled();
  });
});

describe("conversation provider protocol", () => {
  it("sends tool definitions with server-owned history", async () => {
    const fetchMock = vi.fn(async () => Response.json({ choices: [{ finish_reason: "tool_calls", message: call() }] }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await requestConversation(config, { messages: [{ role: "user", content: "hello" }], tools: [], requestId: "test" });
    expect(result.message.tool_calls?.[0].function.name).toBe("slots");
    const payload = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(payload.parallel_tool_calls).toBe(false);
    expect(payload.messages).toEqual([{ role: "user", content: "hello" }]);
  });
  it.each(["length", "content_filter"])("rejects incomplete provider output (%s)", async finish_reason => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ choices: [{ finish_reason, message: answer }] })));
    await expect(requestConversation(config, { messages: [], tools: [], requestId: "test" })).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
  });
  it("never exposes provider errors containing credentials or prompt data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("secret and client data"); }));
    await expect(requestConversation(config, { messages: [], tools: [], requestId: "test" })).rejects.toMatchObject({ code: "AI_PROVIDER_UNAVAILABLE", message: "AI provider request failed." });
  });
});
