import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), ...relativePath.split("/")), "utf8");
}

function filterNames(source: string) {
  return [...new Set([...source.matchAll(/name="([a-zA-Z]+)"/g)].map((match) => match[1]))].sort();
}

const listFiles = [
  "src/app/(app-ar)/admin/cases/page.tsx",
  "src/app/(app-ar)/admin/clients/page.tsx",
  "src/app/(app-ar)/admin/consultations/page.tsx",
  "src/app/(app-ar)/admin/users/page.tsx",
  "src/app/(app-ar)/admin/messages/page.tsx",
  "src/app/(app-ar)/admin/calendar/page.tsx",
  "src/app/(app-ar)/admin/tasks/page.tsx",
  "src/app/(app-ar)/admin/documents/page.tsx",
  "src/app/(app-ar)/admin/finance/page.tsx",
  "src/app/(app-ar)/admin/content/page.tsx",
  "src/app/(app-ar)/admin/audit-log/page.tsx",
  "src/features/admin/contact-messages/contact-message-inbox.tsx"
] as const;

const expectedFilterNames: Record<(typeof listFiles)[number], string[]> = {
  "src/app/(app-ar)/admin/cases/page.tsx": [
    "assignedLawyerId", "caseType", "priority", "q", "sortBy", "sortDirection", "status"
  ],
  "src/app/(app-ar)/admin/clients/page.tsx": [
    "assignedLawyerId", "q", "sortBy", "sortDirection", "source", "status"
  ],
  "src/app/(app-ar)/admin/consultations/page.tsx": [
    "assigned", "q", "review", "status", "view"
  ],
  "src/app/(app-ar)/admin/users/page.tsx": ["q", "roleId", "sortBy", "sortDirection", "status"],
  "src/app/(app-ar)/admin/messages/page.tsx": ["assignedToId", "q", "status"],
  "src/app/(app-ar)/admin/calendar/page.tsx": ["display", "from", "lawyerId", "mode", "status", "to"],
  "src/app/(app-ar)/admin/tasks/page.tsx": [
    "assignedToId", "display", "priority", "q", "sortBy", "sortDirection", "status", "view"
  ],
  "src/app/(app-ar)/admin/documents/page.tsx": [
    "category", "ownerClientId", "q", "sortBy", "sortDirection", "status", "visibility"
  ],
  "src/app/(app-ar)/admin/finance/page.tsx": [
    "attemptQ", "attemptStatus", "caseId", "clientId", "currency", "dateFrom", "dateTo",
    "q", "sortBy", "sortDirection", "status", "tab", "webhookMoneyStatus", "webhookProvider",
    "webhookQ", "webhookStatus"
  ],
  "src/app/(app-ar)/admin/content/page.tsx": [
    "category", "platform", "q", "sortBy", "sortDirection", "status", "tab"
  ],
  "src/app/(app-ar)/admin/audit-log/page.tsx": [
    "action", "actorId", "appointmentId", "caseId", "clientId", "dateFrom", "dateTo",
    "documentId", "lawyerId", "paymentId", "q", "resourceType", "sortBy", "sortDirection"
  ],
  "src/features/admin/contact-messages/contact-message-inbox.tsx": [
    "pageSize", "q", "sortBy", "sortDirection", "status", "topic"
  ]
};

describe("Phase 10 admin list migration contracts", () => {
  it("leaves zero hand-rolled prev/next pagination on migrated list surfaces", () => {
    for (const file of listFiles) {
      const source = read(file);
      expect(source).toContain("AdminPagination");
      expect(source).not.toMatch(/page - 1/);
      expect(source).not.toMatch(/page \+ 1/);
    }
  });

  it("preserves the exact GET filter parameter names per list surface", () => {
    for (const file of listFiles) {
      expect(filterNames(read(file))).toEqual(expectedFilterNames[file]);
    }
  });

  it("routes consultations, content, and finance section navigation through AdminTabs with preserved param hrefs", () => {
    const consultations = read("src/app/(app-ar)/admin/consultations/page.tsx");
    expect(consultations).toContain("AdminTabs");
    expect(consultations).toContain("viewHref(result.filters, view)");

    const content = read("src/app/(app-ar)/admin/content/page.tsx");
    expect(content).toContain("AdminTabs");
    expect(content).toContain('tabHref("articles")');

    const finance = read("src/app/(app-ar)/admin/finance/page.tsx");
    expect(finance).toContain("AdminTabs");
    expect(finance).toContain("financeTabHref(query,");
  });

  it("keeps destructive list actions in their current presentation (no dead menu items, no placeholders)", () => {
    const documents = read("src/features/admin/task-documents/document-list.tsx");
    expect(documents).toContain("DocumentDeleteForm");

    const inbox = read("src/features/admin/contact-messages/contact-message-inbox.tsx");
    expect(inbox).toContain("ARCHIVED");

    for (const file of listFiles) {
      expect(read(file)).not.toContain("TODO");
      expect(read(file)).not.toContain("placeholder-dialog");
    }
  });
});
