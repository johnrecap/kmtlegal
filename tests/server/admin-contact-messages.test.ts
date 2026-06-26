import { describe, expect, it } from "vitest";
import {
  adminContactMessageListQuerySchema,
  adminContactMessageStatusUpdateSchema,
  canManageAdminContactMessages,
  canReadAdminContactMessages
} from "@/server/admin/contact-message-service";
import type { Principal } from "@/server/auth/policy";

const contactManager: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: "Office Admin",
  permissions: ["contact.read.any", "contact.manage.any"]
};

const contactReader: Principal = {
  id: "22222222-2222-4222-8222-222222222222",
  roleName: "Lawyer",
  permissions: ["contact.read.any"]
};

const unrelatedStaff: Principal = {
  id: "33333333-3333-4333-8333-333333333333",
  roleName: "Lawyer",
  permissions: ["client.read.assigned"]
};

describe("admin contact message contract", () => {
  it("keeps contact message reads and status changes behind explicit permissions", () => {
    expect(canReadAdminContactMessages(contactManager)).toBe(true);
    expect(canManageAdminContactMessages(contactManager)).toBe(true);
    expect(canReadAdminContactMessages(contactReader)).toBe(true);
    expect(canManageAdminContactMessages(contactReader)).toBe(false);
    expect(canReadAdminContactMessages(unrelatedStaff)).toBe(false);
  });

  it("validates list filters and status updates", () => {
    const query = adminContactMessageListQuerySchema.parse({
      q: "documents",
      status: "NEW",
      topic: "documents",
      sortBy: "status",
      sortDirection: "asc",
      page: "2",
      pageSize: "25"
    });

    expect(query.page).toBe(2);
    expect(query.pageSize).toBe(25);
    expect(adminContactMessageStatusUpdateSchema.parse({ status: "REVIEWED" }).status).toBe("REVIEWED");
    expect(() => adminContactMessageStatusUpdateSchema.parse({ status: "NEW" })).toThrow();
  });
});
