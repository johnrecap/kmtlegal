import type { AIProviderAdapter, AITask } from "../types";

const REVIEW_NOTE = "Draft only; lawyer review is required before use.";

export function createMockAIProvider(): AIProviderAdapter {
  return {
    name: "mock",
    async generate(input) {
      return {
        provider: "mock",
        model: "mock-kmt-legal-v1",
        task: input.task,
        output: mockOutputForTask(input.task),
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0
        }
      };
    }
  };
}

function mockOutputForTask(task: AITask) {
  switch (task) {
    case "consultation_classification":
      return {
        category: "corporate",
        urgency: "normal",
        confidence: 0.82,
        reasons: ["Mock classification based on structured intake fields."],
        reviewNote: REVIEW_NOTE
      };
    case "intake_summary":
      return {
        summary: "Structured intake summary placeholder for internal review.",
        keyFacts: ["Client submitted a legal inquiry.", "Staff review is required."],
        missingInfo: ["Relevant documents", "Preferred appointment time"],
        reviewNote: REVIEW_NOTE
      };
    case "document_checklist_suggestion":
      return {
        items: [
          { label: "Client identity document", reason: "Needed to verify client profile." },
          { label: "Relevant contract or notice", reason: "Needed to understand the dispute context." }
        ],
        reviewNote: REVIEW_NOTE
      };
    case "anonymous_case_study_draft":
      return {
        title: "Anonymous legal matter draft",
        draft: "A privacy-safe draft outline that must be reviewed and anonymized by staff.",
        anonymizationChecklist: ["Remove names", "Remove dates that identify parties", "Remove opposing party identifiers"],
        reviewNote: REVIEW_NOTE
      };
    case "social_post_draft":
      return {
        platform: "linkedin",
        content: "Informational legal awareness draft for review before publishing.",
        hashtags: ["#LegalAwareness", "#KMTLegal"],
        reviewNote: REVIEW_NOTE
      };
  }
}
