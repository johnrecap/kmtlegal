import type { AISafetyPolicy } from "./types";

export const DEFAULT_AI_SAFETY_POLICY: AISafetyPolicy = {
  requireHumanReview: true,
  prohibitLegalAdvice: true,
  redactBeforeLogging: true
};

export function mergeSafetyPolicy(policy?: Partial<AISafetyPolicy>): AISafetyPolicy {
  return {
    ...DEFAULT_AI_SAFETY_POLICY,
    ...policy,
    requireHumanReview: true,
    prohibitLegalAdvice: true,
    redactBeforeLogging: true
  };
}

export function assertNoFinalLegalAdviceText(output: unknown) {
  const serialized = JSON.stringify(output).toLowerCase();
  const blockedPhrases = [
    "this is legal advice",
    "final legal advice",
    "guaranteed outcome",
    "اضمن",
    "استشارة قانونية نهائية"
  ];

  return !blockedPhrases.some((phrase) => serialized.includes(phrase));
}
