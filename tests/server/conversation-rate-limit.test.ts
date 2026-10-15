import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenAICompatibleProvider } from "@/server/ai/providers/openai-compatible";
import { boundedConversationProvider } from "@/server/ai/company-conversation-policy";
import { conversationRateLimitError } from "@/server/ai/conversation-rate-limit";
import { runConversationTurn } from "@/server/ai/conversation-gateway";
import { phaseFiveErrorResponse } from "@/server/http/phase-five-errors";
import { ApiError } from "@/server/http/errors";
import { z } from "zod";

const config = { provider: "openai-compatible" as const, baseUrl: "https://synthetic.invalid/v1", apiKey: "synthetic", model: "gemini-2.5-flash", timeoutMs: 30_000, maxTokens: 1200, temperature: 0.2 };
const reply = () => Response.json({ choices: [{ finish_reason: "stop", message: { content: "Hello from the office." } }] });
const message = { messages: [{ role: "user" as const, content: "Hello" }], tools: [], requestId: "synthetic-retry" };
const busy = (headers: Record<string, string> = { "Retry-After": "0" }, body = "busy") => new Response(body, { status: 429, headers });
const wrap = (signal = new AbortController().signal, assertActive = async () => {}, deadlineAt = Date.now() + 30_000) =>
  boundedConversationProvider(createOpenAICompatibleProvider(config, config.provider), signal, assertActive, deadlineAt);
const googleError = (details: unknown[]) => JSON.stringify({ error: { code: 429, details } });

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("2026-10-15 provider 429 recovery", () => {
  it("returns the answer after 429 without submitting the message again", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const sent: Array<{ at: number; body: unknown }> = [];
    const fetchMock = vi.fn(async (_url, init) => {
      sent.push({ at: Date.now(), body: JSON.parse(init.body) });
      return sent.length === 1 ? busy({}) : reply();
    });
    vi.stubGlobal("fetch", fetchMock);
    expect((await wrap().chat(message)).message.content).toBe("Hello from the office.");
    expect(sent).toHaveLength(2);
    expect(sent[1].at - sent[0].at).toBeGreaterThanOrEqual(1000);
    expect(sent[1].body).toEqual(sent[0].body);
  });

  it("shares two retries across classification, generation and review", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi.fn().mockResolvedValueOnce(busy()).mockResolvedValueOnce(reply())
      .mockResolvedValueOnce(busy()).mockResolvedValueOnce(reply()).mockResolvedValueOnce(busy());
    vi.stubGlobal("fetch", fetchMock);
    const provider = wrap();
    await provider.chat(message); await provider.chat(message);
    await expect(provider.chat(message)).rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("counts rejected provider requests toward the six-call ceiling", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi.fn().mockResolvedValueOnce(busy()).mockImplementation(async () => reply());
    vi.stubGlobal("fetch", fetchMock);
    const provider = wrap();
    for (let index = 0; index < 5; index += 1) await provider.chat(message);
    await expect(provider.chat(message)).rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("waits one then two seconds when the provider supplies no retry hint", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const sentAt: number[] = [];
    vi.stubGlobal("fetch", vi.fn(async () => { sentAt.push(Date.now()); return busy({}); }));
    await expect(wrap().chat(message)).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(sentAt).toHaveLength(3);
    expect(sentAt[1] - sentAt[0]).toBeGreaterThanOrEqual(1000);
    expect(sentAt[2] - sentAt[1]).toBeGreaterThanOrEqual(2000);
  });

  it.each([30000, 29500, 60000])("does not shorten a requested wait of %i ms to fit the deadline", async milliseconds => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.stubGlobal("fetch", vi.fn(async () => busy({}, googleError([{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: `${milliseconds / 1000}s` }]))));
    await expect(wrap().chat(message)).rejects.toMatchObject({ code: "RATE_LIMITED", retryAfterMs: milliseconds });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("aborts the wait without issuing another provider request", async () => {
    const controller = new AbortController();
    vi.stubGlobal("fetch", vi.fn(async () => { setTimeout(() => controller.abort(), 10); return busy({ "Retry-After": "10" }); }));
    await expect(wrap(controller.signal).chat(message)).rejects.toMatchObject({ code: "AI_PROVIDER_TIMEOUT" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not call the provider after the shared deadline expires", async () => {
    const fetchMock = vi.fn(async () => reply());
    vi.stubGlobal("fetch", fetchMock);
    await expect(wrap(new AbortController().signal, async () => {}, Date.now() - 1).chat(message)).rejects.toMatchObject({ code: "AI_PROVIDER_TIMEOUT" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("checks office ownership again after waiting", async () => {
    let claimed = false;
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.stubGlobal("fetch", vi.fn(async () => { setTimeout(() => { claimed = true; }, 0); return busy(); }));
    await expect(wrap(new AbortController().signal, async () => {
      if (claimed) throw new ApiError(409, "CONFLICT", "Conversation ownership changed.");
    }).chat(message)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401, 403, 502])("does not retry a non-429 provider failure (%i)", async status => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private provider details", { status })));
    await expect(wrap().chat(message)).rejects.toMatchObject({ code: "AI_PROVIDER_UNAVAILABLE", message: "AI provider request failed." });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry malformed successful output", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("malformed", { status: 200 })));
    await expect(wrap().chat(message)).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not execute a tool twice when the following generation is rate limited", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const stored: string[] = [];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ choices: [{ finish_reason: "tool_calls", message: {
      content: null, tool_calls: [{ id: "save1", type: "function", function: { name: "save", arguments: "{}" } }]
    } }] })).mockResolvedValueOnce(busy()).mockResolvedValueOnce(reply()));
    const result = await runConversationTurn({ ...message, provider: wrap(), assertActive: async () => {}, tools: {
      save: { description: "Synthetic side effect", schema: z.strictObject({}), execute: async () => { stored.push("saved once"); return { saved: true }; } }
    } });
    expect(result.text).toBe("Hello from the office.");
    expect(stored).toEqual(["saved once"]);
    expect(result.additions.filter(entry => entry.role === "tool")).toHaveLength(1);
  });

  it.each([["malformed", "not JSON"], ["oversized", "x".repeat(131073)]])("keeps %s 429 envelopes rate limited", async (_kind, raw) => {
    vi.stubGlobal("fetch", vi.fn(async () => busy({ "Retry-After": "40" }, raw)));
    await expect(wrap().chat(message)).rejects.toMatchObject({ code: "RATE_LIMITED", retryAfterMs: 40000 });
  });
});

describe("provider retry metadata and HTTP contract", () => {
  it.each([
    ["3", [], 3000],
    ["2", [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "3.125s" }], 3125],
    [null, [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "2s" }, { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "4s" }], 4000],
    ["invalid", [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "broken" }], null],
    ["-2", [], null], ["", [], null], ["1.5", [], null]
  ])("uses only valid retry durations (%s)", (header, details, expected) => {
    expect(conversationRateLimitError(new Headers(header === null ? {} : { "Retry-After": header }), googleError(details)).retryAfterMs).toBe(expected);
  });

  it("interprets future and expired HTTP dates without a negative delay", () => {
    const now = Date.parse("2026-10-15T12:00:00Z");
    vi.spyOn(Date, "now").mockReturnValue(now);
    expect(conversationRateLimitError(new Headers({ "Retry-After": new Date(now + 5000).toUTCString() }), "").retryAfterMs).toBe(5000);
    expect(conversationRateLimitError(new Headers({ "Retry-After": new Date(now - 5000).toUTCString() }), "").retryAfterMs).toBe(0);
  });

  it.each([{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier", quotaValue: "20" }, { quotaId: "PerMinute", quotaValue: "0" }])("does not retry a confirmed terminal quota: %j", async violation => {
    const body = googleError([{ "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [violation] }, { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "0s" }]);
    vi.stubGlobal("fetch", vi.fn(async () => busy({}, body)));
    await expect(wrap().chat(message)).rejects.toMatchObject({ code: "RATE_LIMITED", retryable: false });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("accepts Google's array-wrapped error envelope without treating the raw body as a message", () => {
    const raw = `[${googleError([{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "5s" }])}]`;
    expect(conversationRateLimitError(new Headers(), raw)).toMatchObject({ retryAfterMs: 5000, retryable: true, message: "AI provider rate limit reached." });
  });

  it("returns the existing localized error envelope and Retry-After after exhausting recovery", async () => {
    const error = conversationRateLimitError(new Headers({ "Retry-After": "40" }), "private error body");
    const response = phaseFiveErrorResponse(error, new Request("http://localhost/api/public/assistant/conversation", { headers: { "x-kmt-locale": "en", "x-request-id": "synthetic" } }));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("40");
    expect(await response.json()).toEqual({ error: { code: "RATE_LIMITED", message: "Please wait before trying again.", details: [], requestId: "synthetic" } });
  });

  it("does not advertise a short retry delay for a confirmed daily quota", () => {
    const error = conversationRateLimitError(new Headers({ "Retry-After": "1" }), googleError([{
      "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" }]
    }]));
    const response = phaseFiveErrorResponse(error, new Request("http://localhost/api/public/assistant/conversation"));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeNull();
  });
});
