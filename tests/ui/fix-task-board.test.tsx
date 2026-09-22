// @vitest-environment jsdom
import React, { StrictMode } from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskBoard } from "@/features/admin/task-documents/task-board";

const initialTask = {
  id: "11111111-1111-4111-8111-111111111111",
  updatedAt: "2026-09-22T10:00:00.000Z",
  title: "المهمة الأولى",
  description: null,
  status: "NEW" as const,
  priority: "NORMAL" as const,
  assignedToId: "22222222-2222-4222-8222-222222222222",
  caseId: null,
  case: null,
  dueDate: null,
  assignedTo: { id: "22222222-2222-4222-8222-222222222222", name: "المسؤول", email: "assignee@example.test" },
  canUpdate: false
};

describe("FIX16 task board pagination", () => {
  it("loads a single lane through the existing list API and deduplicates its next page", async () => {
    const nextTask = { ...initialTask, id: "33333333-3333-4333-8333-333333333333", title: "المهمة الثانية" };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { items: [initialTask, nextTask], total: 3 } })
    });
    vi.stubGlobal("fetch", fetchMock);
    const { container, getByRole } = render(
      <StrictMode><TaskBoard
        filters={{ view: "mine", priority: "HIGH", sortBy: "dueDate", sortDirection: "asc" }}
        initialColumns={[{ status: "NEW", total: 3, items: [initialTask] }]}
        options={{ assignees: [], cases: [] }}
      /></StrictMode>
    );

    fireEvent.click(getByRole("button", { name: "تحميل المزيد" }));

    await waitFor(() => expect(container.querySelectorAll("[data-task-id]")).toHaveLength(2));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("display=list&status=NEW&pageSize=12&page=2"),
      expect.objectContaining({ cache: "no-store", signal: expect.any(AbortSignal) })
    );
    expect(fetchMock.mock.calls[0]?.[0]).toContain("view=mine");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("priority=HIGH");
    fireEvent.click(getByRole("button", { name: "تحميل المزيد" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1]?.[0]).toContain("page=3");
    vi.unstubAllGlobals();
  });
});
