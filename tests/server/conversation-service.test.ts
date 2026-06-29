import { describe, expect, it } from "vitest";
import type { Principal } from "@/server/auth/policy";
import {
  adminConversationListQuerySchema,
  canAssignAdminConversations,
  canManageAdminConversations,
  canReadAdminConversations,
  canReplyAdminConversations,
  canUseClientConversations,
  clientConversationCreateSchema,
  conversationMessageCreateSchema
} from "@/server/conversations/conversation-service";

describe("conversation service contracts", () => {
  it("allows only a client principal with own conversation permissions to use client chat", () => {
    const client: Principal = {
      id: "client-user",
      roleName: "Client",
      clientId: "client-id",
      permissions: ["client.read.self", "conversation.read.own", "conversation.create.own", "conversation.reply.own"]
    };

    const missingReply: Principal = {
      ...client,
      permissions: ["client.read.self", "conversation.read.own", "conversation.create.own"]
    };

    expect(canUseClientConversations(client)).toBe(true);
    expect(canUseClientConversations(missingReply)).toBe(false);
    expect(canUseClientConversations({ ...client, clientId: null })).toBe(false);
  });

  it("separates admin read, reply, assign, and manage permissions", () => {
    const secretary: Principal = {
      id: "staff-user",
      roleName: "Secretary",
      permissions: ["conversation.read.any", "conversation.reply.any", "conversation.assign.any"]
    };

    expect(canReadAdminConversations(secretary)).toBe(true);
    expect(canReplyAdminConversations(secretary)).toBe(true);
    expect(canAssignAdminConversations(secretary)).toBe(true);
    expect(canManageAdminConversations(secretary)).toBe(false);
    expect(canManageAdminConversations({ ...secretary, permissions: ["conversation.manage.any"] })).toBe(true);
  });

  it("validates bounded human-message payloads and admin filters", () => {
    expect(conversationMessageCreateSchema.parse({ message: "hello" }).message).toBe("hello");
    expect(() => conversationMessageCreateSchema.parse({ message: "" })).toThrow();
    expect(() => conversationMessageCreateSchema.parse({ message: "x".repeat(2001) })).toThrow();
    expect(() => conversationMessageCreateSchema.parse({ message: "hello", extra: true })).toThrow();

    expect(clientConversationCreateSchema.parse({ message: "hello", subject: "Support" }).subject).toBe("Support");
    expect(adminConversationListQuerySchema.parse({ status: "WAITING_STAFF", page: "2" }).page).toBe(2);
    expect(() => adminConversationListQuerySchema.parse({ status: "UNKNOWN" })).toThrow();
  });
});
