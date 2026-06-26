import { describe, expect, it, vi } from "vitest";
import {
  contactMessageReference,
  createPublicContactMessage,
  publicContactMessageSchema
} from "@/server/contact/contact-message-service";

describe("public contact message service", () => {
  it("validates public contact payloads and creates a non-sensitive reference", () => {
    const parsed = publicContactMessageSchema.parse({
      fullName: "Ahmed Mansour",
      email: "AHMED@example.com",
      phone: "+20 100 000 0000",
      topic: "consultation",
      message: "Please contact me about a legal consultation.",
      consent: true
    });

    expect(parsed.email).toBe("ahmed@example.com");
    expect(contactMessageReference("12345678-0000-4000-8000-000000000000")).toBe("MSG-12345678");
  });

  it("persists the message and keeps raw contact content out of audit metadata", async () => {
    const body = publicContactMessageSchema.parse({
      fullName: "Ahmed Mansour",
      email: "ahmed@example.com",
      phone: "0100 000 0000",
      topic: "documents",
      message: "Please review the attached documents and call me back.",
      consent: true
    });
    const contactMessageCreate = vi.fn(
      async (args: { data: { status: string; topic: string }; select: Record<string, boolean> }) => ({
      id: "12345678-0000-4000-8000-000000000000",
      status: args.data.status,
      topic: args.data.topic,
      createdAt: new Date("2026-06-26T10:00:00.000Z")
      })
    );
    const audit = vi.fn(
      async (_input: { action: string; resourceType: string; requestId?: string; metadata: unknown }) => null
    );

    const result = await createPublicContactMessage({
      body,
      client: { contactMessage: { create: contactMessageCreate } } as never,
      audit: audit as never,
      requestId: "req-contact"
    });

    expect(result).toMatchObject({
      id: "12345678-0000-4000-8000-000000000000",
      reference: "MSG-12345678",
      status: "NEW"
    });
    expect(contactMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "ahmed@example.com",
          phone: "0100 000 0000",
          phoneCanonical: "201000000000",
          message: body.message
        })
      })
    );

    expect(audit).toHaveBeenCalledOnce();
    const auditInput = audit.mock.calls[0][0];
    expect(auditInput).toMatchObject({
      action: "contact.message_create",
      resourceType: "ContactMessage",
      requestId: "req-contact"
    });
    expect(JSON.stringify(auditInput.metadata)).not.toContain(body.message);
    expect(JSON.stringify(auditInput.metadata)).not.toContain(body.email);
    expect(JSON.stringify(auditInput.metadata)).not.toContain(body.phone);
  });
});
