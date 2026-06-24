import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { validationDetailsFromIssues } from "@/server/validation/schemas";
import { getAIProviderConfig } from "./config";
import { getAIProvider } from "./provider-registry";
import { assertNoFinalLegalAdviceText, mergeSafetyPolicy } from "./safety";
import type { AIGatewayInput, AIGatewayResult } from "./types";

export async function generateStructured<TOutput>(input: AIGatewayInput<TOutput>): Promise<AIGatewayResult<TOutput>> {
  const requestId = input.requestId ?? crypto.randomUUID();
  const safetyPolicy = mergeSafetyPolicy(input.safetyPolicy);
  const config = getAIProviderConfig();
  const provider = getAIProvider(config);
  const startedAt = Date.now();

  try {
    const providerResult = await provider.generate({
      task: input.task,
      locale: input.locale,
      input: input.input,
      safetyPolicy,
      requestId
    });

    const latencyMs = Date.now() - startedAt;
    const parsed = input.schema.safeParse(providerResult.output);

    if (!parsed.success || !assertNoFinalLegalAdviceText(providerResult.output)) {
      await recordAiProviderRun({
        shouldRecord: input.recordRun,
        actorId: input.actorId,
        provider: providerResult.provider,
        model: providerResult.model,
        task: input.task,
        requestId,
        reviewRequired: true,
        latencyMs,
        usage: providerResult.usage,
        status: "SCHEMA_INVALID",
        errorCode: "AI_OUTPUT_INVALID"
      });

      throw new ApiError(
        502,
        "AI_OUTPUT_INVALID",
        "AI provider output failed schema or safety validation.",
        parsed.success ? [] : validationDetailsFromIssues(parsed.error.issues)
      );
    }

    await recordAiProviderRun({
      shouldRecord: input.recordRun,
      actorId: input.actorId,
      provider: providerResult.provider,
      model: providerResult.model,
      task: input.task,
      requestId,
      reviewRequired: true,
      latencyMs,
      usage: providerResult.usage,
      status: "SUCCEEDED"
    });

    return {
      provider: providerResult.provider,
      model: providerResult.model,
      task: input.task,
      output: parsed.data,
      usage: providerResult.usage,
      latencyMs,
      reviewRequired: true,
      requestId
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "AI_PROVIDER_TIMEOUT" || error.code === "AI_PROVIDER_UNAVAILABLE") {
        await recordAiProviderRun({
          shouldRecord: input.recordRun,
          actorId: input.actorId,
          provider: config.provider,
          model: config.model,
          task: input.task,
          requestId,
          reviewRequired: true,
          latencyMs: Date.now() - startedAt,
          status: error.code === "AI_PROVIDER_TIMEOUT" ? "TIMEOUT" : "PROVIDER_ERROR",
          errorCode: error.code
        });
      }
      throw error;
    }

    await recordAiProviderRun({
      shouldRecord: input.recordRun,
      actorId: input.actorId,
      provider: config.provider,
      model: config.model,
      task: input.task,
      requestId,
      reviewRequired: true,
      latencyMs: Date.now() - startedAt,
      status: "PROVIDER_ERROR",
      errorCode: "AI_PROVIDER_UNAVAILABLE"
    });

    throw new ApiError(502, "AI_PROVIDER_UNAVAILABLE", "AI provider request failed.");
  }
}

async function recordAiProviderRun(input: {
  shouldRecord?: boolean;
  actorId?: string | null;
  provider: string;
  model: string;
  task: string;
  requestId: string;
  reviewRequired: boolean;
  latencyMs: number;
  usage?: unknown;
  status: "SUCCEEDED" | "SCHEMA_INVALID" | "PROVIDER_ERROR" | "TIMEOUT";
  errorCode?: string;
}) {
  if (input.shouldRecord === false) {
    return;
  }

  await prisma.aiProviderRun.create({
    data: {
      provider: input.provider,
      model: input.model,
      task: input.task,
      requestId: input.requestId,
      reviewRequired: input.reviewRequired,
      latencyMs: Math.max(0, Math.round(input.latencyMs)),
      usageJson: (input.usage ?? undefined) as Prisma.InputJsonValue | undefined,
      status: input.status,
      errorCode: input.errorCode,
      createdById: input.actorId ?? null
    }
  });
}
