import { z } from "zod";

export const consultationClassificationOutputSchema = z.object({
  category: z.string().min(1),
  urgency: z.enum(["low", "normal", "high", "urgent"]),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()).max(5),
  reviewNote: z.string().min(1)
});

export const intakeSummaryOutputSchema = z.object({
  summary: z.string().min(1),
  keyFacts: z.array(z.string()).max(10),
  missingInfo: z.array(z.string()).max(10),
  reviewNote: z.string().min(1)
});

export const documentChecklistOutputSchema = z.object({
  items: z.array(z.object({ label: z.string().min(1), reason: z.string().min(1) })).max(12),
  reviewNote: z.string().min(1)
});

export const anonymousCaseStudyDraftOutputSchema = z.object({
  title: z.string().min(1),
  draft: z.string().min(1),
  anonymizationChecklist: z.array(z.string()).min(1),
  reviewNote: z.string().min(1)
});

export const socialPostDraftOutputSchema = z.object({
  platform: z.string().min(1),
  content: z.string().min(1),
  hashtags: z.array(z.string()).max(8),
  reviewNote: z.string().min(1)
});
