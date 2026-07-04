import { z } from "zod";

const bookingServiceCategorySchema = z.enum([
  "legal-consultation",
  "corporate-business-services",
  "real-estate-legal-support",
  "claims-collections"
]);

const bookingFieldConfidenceSchema = z.object({
  fullName: z.number().min(0).max(1).optional().default(0),
  phone: z.number().min(0).max(1).optional().default(0),
  email: z.number().min(0).max(1).optional().default(0),
  city: z.number().min(0).max(1).optional().default(0),
  serviceCategory: z.number().min(0).max(1).optional().default(0),
  summary: z.number().min(0).max(1).optional().default(0),
  urgency: z.number().min(0).max(1).optional().default(0),
  preferredMode: z.number().min(0).max(1).optional().default(0),
  availabilityPreference: z.number().min(0).max(1).optional().default(0)
});

export const bookingIntakeExtractionOutputSchema = z.object({
  intent: z.enum(["booking", "reference_inquiry", "legal_advice", "unclear"]),
  fields: z
    .object({
      fullName: z.string().trim().min(2).max(120).nullable().optional(),
      phone: z.string().trim().min(6).max(40).nullable().optional(),
      email: z.string().trim().email().max(254).nullable().optional(),
      city: z.string().trim().max(80).nullable().optional(),
      serviceCategory: bookingServiceCategorySchema.nullable().optional(),
      summary: z.string().trim().min(10).max(3000).nullable().optional(),
      urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).nullable().optional(),
      preferredMode: z.enum(["PHONE", "ONLINE", "OFFICE"]).nullable().optional(),
      availabilityPreference: z
        .object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
          label: z.string().trim().max(80).nullable().optional(),
          timeWindow: z.enum(["MORNING", "AFTERNOON", "EVENING", "ANYTIME"]).nullable().optional(),
          fromTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
          toTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional()
        })
        .nullable()
        .optional()
    })
    .default({}),
  fieldConfidence: bookingFieldConfidenceSchema.default({
    fullName: 0,
    phone: 0,
    email: 0,
    city: 0,
    serviceCategory: 0,
    summary: 0,
    urgency: 0,
    preferredMode: 0,
    availabilityPreference: 0
  }),
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
  clarifyingQuestion: z.string().trim().max(300).nullable().optional(),
  legalAdviceRequested: z.boolean(),
  reviewNote: z.string().min(1)
});

export const consultationClassificationOutputSchema = z.object({
  category: z.string().min(1),
  urgency: z.enum(["low", "normal", "high", "urgent"]),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()).max(5),
  reviewNote: z.string().min(1)
});

export const consultationAssistantOutputSchema = z.object({
  action: z.enum([
    "answer_general",
    "collect_booking_fields",
    "book_consultation_appointment",
    "appointment_inquiry",
    "handoff_to_human"
  ]),
  message: z.string().min(1).max(1200),
  missingFields: z.array(z.string().min(1).max(80)).max(10).default([]),
  serviceCategory: z.string().trim().max(80).optional().nullable(),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional().nullable(),
  preferredMode: z.enum(["PHONE", "ONLINE", "OFFICE"]).optional().nullable(),
  startsAt: z.string().trim().max(80).optional().nullable(),
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
