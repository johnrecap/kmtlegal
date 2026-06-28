import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError } from "@/server/http/errors";
import { AI_REVIEW_DISCLAIMER } from "@/server/ai/copy";
import { generateStructured } from "@/server/ai/gateway";
import { consultationAssistantOutputSchema, consultationClassificationOutputSchema, intakeSummaryOutputSchema } from "@/server/ai/schemas";
import { createOpenAICompatibleProvider } from "@/server/ai/providers/openai-compatible";

describe("AI Provider Gateway", () => {
  it("normalizes deterministic mock provider output and requires review", async () => {
    process.env.AI_PROVIDER = "mock";

    const result = await generateStructured({
      task: "consultation_classification",
      locale: "ar",
      input: { summary: "demo" },
      schema: consultationClassificationOutputSchema,
      requestId: "req_ai_mock",
      recordRun: false
    });

    expect(result.provider).toBe("mock");
    expect(result.task).toBe("consultation_classification");
    expect(result.reviewRequired).toBe(true);
    expect(result.requestId).toBe("req_ai_mock");
    expect(result.output.confidence).toBeGreaterThan(0);
  });

  it("rejects schema-invalid output", async () => {
    process.env.AI_PROVIDER = "mock";

    await expect(
      generateStructured({
        task: "intake_summary",
        locale: "ar",
        input: { summary: "demo" },
        schema: z.object({ impossible: z.literal("required") }),
        recordRun: false
      })
    ).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
  });

  it("supports the consultation assistant task through the gateway", async () => {
    process.env.AI_PROVIDER = "mock";

    const result = await generateStructured({
      task: "consultation_assistant",
      locale: "ar",
      input: { message: "أريد حجز استشارة" },
      schema: consultationAssistantOutputSchema,
      requestId: "req_ai_assistant",
      recordRun: false
    });

    expect(result.task).toBe("consultation_assistant");
    expect(["answer_general", "collect_booking_fields", "book_consultation_appointment", "appointment_inquiry", "handoff_to_human"]).toContain(result.output.action);
  });


  it("provides review-gated copy and rejects final legal-advice phrasing", async () => {
    process.env.AI_PROVIDER = "openai-compatible";
    process.env.AI_BASE_URL = "https://model.test/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "provider/model";

    const originalFetch = global.fetch;
    global.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          model: "provider/model",
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "This is final legal advice.",
                  keyFacts: [],
                  missingInfo: [],
                  reviewNote: "review"
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    try {
      expect(AI_REVIEW_DISCLAIMER.ar).toContain("ليست استشارة قانونية نهائية");
      await expect(
        generateStructured({
          task: "intake_summary",
          locale: "en",
          input: {},
          schema: intakeSummaryOutputSchema,
          recordRun: false
        })
      ).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
    } finally {
      global.fetch = originalFetch;
      process.env.AI_PROVIDER = "mock";
      delete process.env.AI_BASE_URL;
      delete process.env.AI_API_KEY;
      delete process.env.AI_MODEL;
    }
  });

  it("keeps provider-specific OpenAI-compatible calls behind an adapter", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          model: "provider/model",
          choices: [{ message: { content: JSON.stringify({ summary: "ok", keyFacts: [], missingInfo: [], reviewNote: "review" }) } }],
          usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });
    const originalFetch = global.fetch;
    global.fetch = fetchMock as typeof fetch;

    try {
      const provider = createOpenAICompatibleProvider(
        {
          provider: "openai-compatible",
          baseUrl: "https://model.test/v1",
          apiKey: "test-key",
          model: "provider/model",
          timeoutMs: 1000,
          maxTokens: 200,
          temperature: 0.2
        },
        "openai-compatible"
      );

      const result = await provider.generate({
        task: "intake_summary",
        locale: "ar",
        input: { clientName: "Sensitive Name" },
        safetyPolicy: { requireHumanReview: true, prohibitLegalAdvice: true, redactBeforeLogging: true },
        requestId: "req_provider"
      });

      expect(intakeSummaryOutputSchema.parse(result.output).summary).toBe("ok");
      expect(result.provider).toBe("openai-compatible");
      expect(result.usage?.totalTokens).toBe(5);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/chat/completions"), expect.any(Object));
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("normalizes provider timeouts", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
    ) as typeof fetch;

    try {
      const provider = createOpenAICompatibleProvider(
        {
          provider: "openai-compatible",
          baseUrl: "https://model.test/v1",
          apiKey: "test-key",
          model: "provider/model",
          timeoutMs: 1,
          maxTokens: 200,
          temperature: 0.2
        },
        "openai-compatible"
      );

      await expect(
        provider.generate({
          task: "intake_summary",
          locale: "ar",
          input: {},
          safetyPolicy: { requireHumanReview: true, prohibitLegalAdvice: true, redactBeforeLogging: true },
          requestId: "req_timeout"
        })
      ).rejects.toBeInstanceOf(ApiError);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
