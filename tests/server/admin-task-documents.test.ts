import { describe, expect, it } from "vitest";
import {
  adminDocumentDeleteSchema,
  adminDocumentListQuerySchema,
  adminDocumentUpdateSchema,
  adminTaskListQuerySchema,
  adminTaskWriteSchema,
  canCreateAdminTask,
  canListAdminDocuments,
  canListAdminTasks,
  canManageAdminDocuments,
  canManageAdminTask,
  canReadAdminTask,
  documentScopeWhereForPrincipal,
  taskScopeWhereForPrincipal
} from "@/server/admin/task-document-service";
import { ROLES, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";

const officeAdmin: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: ROLES.officeAdmin,
  permissions: ["task.manage.any", "document.manage.any", "case.read.any"]
};

const assignedLawyer: Principal = {
  id: "22222222-2222-4222-8222-222222222222",
  roleName: ROLES.lawyer,
  permissions: ["task.read.assigned", "task.manage.assigned", "document.read.assigned", "case.read.assigned"]
};

const otherLawyer: Principal = {
  id: "33333333-3333-4333-8333-333333333333",
  roleName: ROLES.lawyer,
  permissions: ["task.read.assigned", "task.manage.assigned", "document.read.assigned", "case.read.assigned"]
};

const marketing: Principal = {
  id: "44444444-4444-4444-8444-444444444444",
  roleName: ROLES.marketingStaff,
  permissions: ["content.create.any"]
};

describe("admin task and document management contract", () => {
  it("scopes task lists to any-task permission or assigned lawyer ownership", () => {
    expect(taskScopeWhereForPrincipal(officeAdmin)).toEqual({});
    expect(taskScopeWhereForPrincipal(assignedLawyer)).toEqual({
      OR: [{ assignedToId: assignedLawyer.id }, { case: { assignedLawyerId: assignedLawyer.id, deletedAt: null } }]
    });

    try {
      taskScopeWhereForPrincipal(marketing);
      throw new Error("expected permission failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(403);
    }
  });

  it("allows task create/read/manage only inside the actor task scope", () => {
    const assignedTask = { assignedToId: assignedLawyer.id, case: { assignedLawyerId: assignedLawyer.id, deletedAt: null } };
    const otherTask = { assignedToId: otherLawyer.id, case: { assignedLawyerId: otherLawyer.id, deletedAt: null } };

    expect(canListAdminTasks(officeAdmin)).toBe(true);
    expect(canListAdminTasks(assignedLawyer)).toBe(true);
    expect(canListAdminTasks(marketing)).toBe(false);

    expect(canCreateAdminTask(officeAdmin)).toBe(true);
    expect(canCreateAdminTask(assignedLawyer)).toBe(true);
    expect(canCreateAdminTask(marketing)).toBe(false);

    expect(canReadAdminTask(officeAdmin, otherTask)).toBe(true);
    expect(canReadAdminTask(assignedLawyer, assignedTask)).toBe(true);
    expect(canReadAdminTask(assignedLawyer, otherTask)).toBe(false);

    expect(canManageAdminTask(officeAdmin, otherTask)).toBe(true);
    expect(canManageAdminTask(assignedLawyer, assignedTask)).toBe(true);
    expect(canManageAdminTask(assignedLawyer, otherTask)).toBe(false);
  });

  it("scopes document lists to document managers or assigned lawyers", () => {
    expect(documentScopeWhereForPrincipal(officeAdmin)).toEqual({ deletedAt: null });
    expect(documentScopeWhereForPrincipal(assignedLawyer)).toEqual({
      deletedAt: null,
      OR: [{ ownerClient: { assignedLawyerId: assignedLawyer.id } }, { case: { assignedLawyerId: assignedLawyer.id } }]
    });

    try {
      documentScopeWhereForPrincipal(marketing);
      throw new Error("expected permission failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(403);
    }
  });

  it("keeps document mutation restricted to document managers", () => {
    expect(canListAdminDocuments(officeAdmin)).toBe(true);
    expect(canListAdminDocuments(assignedLawyer)).toBe(true);
    expect(canListAdminDocuments(marketing)).toBe(false);

    expect(canManageAdminDocuments(officeAdmin)).toBe(true);
    expect(canManageAdminDocuments(assignedLawyer)).toBe(false);
    expect(canManageAdminDocuments(marketing)).toBe(false);
  });

  it("validates task and document list/write contracts", () => {
    const taskList = adminTaskListQuerySchema.parse({
      q: "KMT",
      view: "overdue",
      status: "IN_PROGRESS",
      priority: "URGENT",
      sortBy: "priority",
      sortDirection: "desc",
      page: "2",
      pageSize: "20"
    });

    expect(taskList.view).toBe("overdue");
    expect(taskList.page).toBe(2);
    expect(taskList.pageSize).toBe(20);

    const taskWrite = adminTaskWriteSchema.parse({
      title: "Review contract clause",
      description: "",
      status: "NEW",
      priority: "HIGH",
      assignedToId: assignedLawyer.id,
      caseId: "",
      dueDate: ""
    });

    expect(taskWrite.priority).toBe("HIGH");
    expect(taskWrite.caseId).toBe("");

    const documentList = adminDocumentListQuerySchema.parse({
      q: "contract",
      status: "UNDER_REVIEW",
      category: "CONTRACT",
      visibility: "STAFF_ONLY",
      sortBy: "fileName",
      sortDirection: "asc"
    });

    expect(documentList.status).toBe("UNDER_REVIEW");
    expect(documentList.sortDirection).toBe("asc");

    const update = adminDocumentUpdateSchema.parse({
      status: "ACCEPTED",
      category: "COURT_FILE",
      visibility: "CLIENT_VISIBLE",
      note: "Reviewed"
    });

    expect(update.visibility).toBe("CLIENT_VISIBLE");
    expect(() => adminDocumentDeleteSchema.parse({ reason: "duplicate", confirmDelete: false })).toThrow();
    expect(adminDocumentDeleteSchema.parse({ reason: "duplicate", confirmDelete: true }).confirmDelete).toBe(true);
  });
});
