import type { z } from "zod";

export type AIProviderName = "mock" | "openrouter" | "openai-compatible" | "local" | "custom";

export type AITask =
  | "booking_intake_extraction"
  | "consultation_classification"
  | "consultation_assistant"
  | "intake_summary"
  | "document_checklist_suggestion"
  | "anonymous_case_study_draft"
  | "social_post_draft";

export type AISafetyPolicy = {
  requireHumanReview: boolean;
  prohibitLegalAdvice: boolean;
  redactBeforeLogging: boolean;
};

export type AIGatewayInput<TOutput> = {
  task: AITask;
  locale: "ar" | "en";
  input: unknown;
  schema: z.ZodType<TOutput>;
  safetyPolicy?: Partial<AISafetyPolicy>;
  actorId?: string | null;
  requestId?: string;
  recordRun?: boolean;
};

export type AIUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type AIProviderResult = {
  provider: AIProviderName;
  model: string;
  task: AITask;
  output: unknown;
  usage?: AIUsage;
};

export type AIGatewayResult<TOutput> = {
  provider: AIProviderName;
  model: string;
  task: AITask;
  output: TOutput;
  usage?: AIUsage;
  latencyMs: number;
  reviewRequired: boolean;
  requestId: string;
};

export type AIProviderAdapter = {
  name: AIProviderName;
  generate(input: {
    task: AITask;
    locale: "ar" | "en";
    input: unknown;
    safetyPolicy: AISafetyPolicy;
    requestId: string;
  }): Promise<AIProviderResult>;
};
