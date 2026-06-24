import { afterEach, describe, expect, it } from "vitest";
import { getEmailMode, isSmtpEnabled, isSmtpFeatureAvailable } from "@/server/email/config";
import { hashEmailAddress, sendTemplatedEmail } from "@/server/email/email-service";
import { renderEmailTemplate } from "@/server/email/templates";

const previousSmtpEnabled = process.env.SMTP_ENABLED;

afterEach(() => {
  if (previousSmtpEnabled === undefined) {
    Reflect.deleteProperty(process.env, "SMTP_ENABLED");
  } else {
    process.env.SMTP_ENABLED = previousSmtpEnabled;
  }
});

describe("email service abstraction", () => {
  it("keeps SMTP disabled in this release and returns safe delivery metadata", async () => {
    Reflect.deleteProperty(process.env, "SMTP_ENABLED");
    expect(isSmtpFeatureAvailable()).toBe(false);
    expect(isSmtpEnabled()).toBe(false);
    expect(getEmailMode()).toBe("disabled");

    const result = await sendTemplatedEmail({
      to: { email: "Staff@KMT.local" },
      templateKey: "staff_2fa_email_otp",
      data: { otp: "123456", expiresInMinutes: 10 }
    });

    expect(result.mode).toBe("disabled");
    expect(result.providerMessageId).toBeUndefined();
    expect(result.toEmailHash).toBe(hashEmailAddress("staff@kmt.local"));
    expect(result.toEmailHash).not.toContain("Staff");
  });

  it("does not enable SMTP runtime even if SMTP_ENABLED is set before the future activation plan", () => {
    process.env.SMTP_ENABLED = "true";
    expect(isSmtpFeatureAvailable()).toBe(false);
    expect(isSmtpEnabled()).toBe(false);
    expect(getEmailMode()).toBe("disabled");
  });

  it("renders supported future email templates without sending mail", () => {
    expect(renderEmailTemplate("consultation_confirmation", { fullName: "Client", reference: "CONS-1" }).subject).toContain(
      "consultation"
    );
    expect(renderEmailTemplate("staff_notification", { title: "New request", summary: "Review needed" }).text).toBe(
      "Review needed"
    );
    expect(renderEmailTemplate("security_notification", { title: "Security", summary: "Password changed" }).subject).toBe(
      "Security"
    );
    expect(renderEmailTemplate("appointment_reminder", { title: "Call", startsAt: "10:00" }).text).toContain("10:00");
  });
});
