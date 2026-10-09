import { z } from "zod";
import { parseWithSchema } from "@/server/validation/schemas";

export type EmailTemplateKey =
  | "client_account_access"
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
  client_account_access: z.object({
    url: z.string().url(), locale: z.enum(["ar", "en"]), purpose: z.enum(["ACTIVATE", "RECOVER", "LOGIN"])
  }),
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
    case "client_account_access": {
      const parsed = parseWithSchema(templateSchemas.client_account_access, data);
      const ar = parsed.locale === "ar";
      return {
        subject: ar ? "الوصول الآمن إلى حسابك لدى KMT Legal" : "Secure access to your KMT Legal account",
        text: parsed.purpose === "LOGIN"
          ? (ar ? `لديك حساب بالفعل. سجّل الدخول للمتابعة: ${parsed.url}\nإذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.` : `You already have an account. Sign in to continue: ${parsed.url}\nIf you did not request this, ignore this message.`)
          : (ar ? `استخدم الرابط التالي للتحقق من بريدك وإعداد كلمة المرور. ينتهي خلال 30 دقيقة ويُستخدم مرة واحدة:\n${parsed.url}\nلا تشارك الرابط أو كلمة المرور في المحادثة. إذا لم تطلب ذلك، تجاهل هذه الرسالة.` : `Use this single-use link to verify your email and set your password. It expires in 30 minutes:\n${parsed.url}\nDo not share this link or your password in chat. If you did not request this, ignore this message.`)
      };
    }
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
