import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { safeLog } from "@/server/observability/safe-log";
import { validationDetailsFromIssues } from "@/server/validation/schemas";
import { getAIProviderConfig } from "./config";
import { getAIProvider } from "./provider-registry";
import { assertNoFinalLegalAdviceText, mergeSafetyPolicy } from "./safety";
import type { AIGatewayInput, AIGatewayResult, AIProviderResult } from "./types";

export async function generateStructured<TOutput>(input: AIGatewayInput<TOutput>): Promise<AIGatewayResult<TOutput>> {
  const requestId = input.requestId ?? crypto.randomUUID();
  const safetyPolicy = mergeSafetyPolicy(input.safetyPolicy);
  const config = getAIProviderConfig();
  const provider = getAIProvider(config);
  const startedAt = Date.now();

  let providerResult: AIProviderResult;
  try {
    providerResult = await provider.generate({
      task: input.task,
      locale: input.locale,
      input: input.input,
      outputSchema: input.schema,
      safetyPolicy,
      requestId
    });
  } catch (error) {
    const apiError = error instanceof ApiError
      ? error
      : new ApiError(502, "AI_PROVIDER_UNAVAILABLE", "AI provider request failed.");
    const diagnosticKind = providerDiagnosticKind(apiError);
    const status = providerRunStatus(apiError);

    safeLog("warn", "ai.provider_generation_failed", {
      provider: config.provider,
      model: config.model,
      task: input.task,
      requestId,
      diagnosticKind,
      errorCode: apiError.code
    });
    await recordAiProviderRun({
      shouldRecord: input.recordRun,
      actorId: input.actorId,
      provider: config.provider,
      model: config.model,
      task: input.task,
      requestId,
      reviewRequired: true,
      latencyMs: Date.now() - startedAt,
      status,
      errorCode: apiError.code
    });

    throw apiError;
  }

  const latencyMs = Date.now() - startedAt;
  const parsed = input.schema.safeParse(providerResult.output);
  const safetyValid = parsed.success && assertNoFinalLegalAdviceText(input.task, parsed.data);

  if (!parsed.success || !safetyValid) {
    const diagnosticKind = parsed.success ? "safety" : "schema";
    safeLog("warn", "ai.provider_output_rejected", {
      provider: providerResult.provider,
      model: providerResult.model,
      task: input.task,
      requestId,
      diagnosticKind,
      schemaIssueCount: parsed.success ? 0 : parsed.error.issues.length
    });
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
      errorCode: parsed.success ? "AI_SAFETY_REJECTED" : "AI_OUTPUT_INVALID"
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
}

function providerDiagnosticKind(error: ApiError) {
  if (error.code === "AI_PROVIDER_TIMEOUT") return "timeout";
  if (error.code === "AI_OUTPUT_INVALID") return "schema";
  return "provider";
}

function providerRunStatus(error: ApiError): "SCHEMA_INVALID" | "PROVIDER_ERROR" | "TIMEOUT" {
  if (error.code === "AI_PROVIDER_TIMEOUT") return "TIMEOUT";
  if (error.code === "AI_OUTPUT_INVALID") return "SCHEMA_INVALID";
  return "PROVIDER_ERROR";
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
