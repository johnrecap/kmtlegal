import { z } from "zod";
import { parseWithSchema } from "@/server/validation/schemas";

export type EmailTemplateKey =
  | "consultation_confirmation"
  | "staff_notification"
  | "staff_2fa_email_otp"
  | "security_notification"
  | "appointment_reminder";

export const emailRecipientSchema = z.object({
  email: z.string().email(),
  userId: z.string().uuid().optional()
});

const templateSchemas = {
  consultation_confirmation: z.object({
    fullName: z.string().min(1),
    reference: z.string().min(1)
  }),
  staff_notification: z.object({
    title: z.string().min(1),
    summary: z.string().min(1)
  }),
  staff_2fa_email_otp: z.object({
    otp: z.string().regex(/^\d{6}$/),
    expiresInMinutes: z.number().int().min(1).max(30)
  }),
  security_notification: z.object({
    title: z.string().min(1),
    summary: z.string().min(1)
  }),
  appointment_reminder: z.object({
    title: z.string().min(1),
    startsAt: z.string().min(1)
  })
} as const;

export function renderEmailTemplate(templateKey: EmailTemplateKey, data: unknown) {
  switch (templateKey) {
    case "consultation_confirmation": {
      const parsed = parseWithSchema(templateSchemas.consultation_confirmation, data);
      return {
        subject: "KMT Legal consultation request received",
        text: `Hello ${parsed.fullName}, your consultation request was received. Reference: ${parsed.reference}.`
      };
    }
    case "staff_notification": {
      const parsed = parseWithSchema(templateSchemas.staff_notification, data);
      return {
        subject: parsed.title,
        text: parsed.summary
      };
    }
    case "staff_2fa_email_otp": {
      const parsed = parseWithSchema(templateSchemas.staff_2fa_email_otp, data);
      return {
        subject: "KMT Legal staff verification code",
        text: `Your verification code is ${parsed.otp}. It expires in ${parsed.expiresInMinutes} minutes.`
      };
    }
    case "security_notification": {
      const parsed = parseWithSchema(templateSchemas.security_notification, data);
      return {
        subject: parsed.title,
        text: parsed.summary
      };
    }
    case "appointment_reminder": {
      const parsed = parseWithSchema(templateSchemas.appointment_reminder, data);
      return {
        subject: `Appointment reminder: ${parsed.title}`,
        text: `Reminder: ${parsed.title} starts at ${parsed.startsAt}.`
      };
    }
  }
}
