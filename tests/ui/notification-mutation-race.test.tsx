// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNotificationRead } from "@/features/admin/notifications/admin-notification-popover";

const unreadItem = {
  kind: "generic" as const,
  id: "62000000-0000-4000-8000-000000000001",
  type: "CASE" as const,
  title: "Updated case",
  body: "Review the update.",
  href: "/admin/cases",
  readAt: null,
  createdAt: "2026-09-22T10:00:00.000Z"
};

const staleSnapshot = {
  genericUnreadCount: 1,
  consultationReviewCount: 0,
  attentionCount: 1,
  nextCursor: null,
  items: [unreadItem]
};

describe("notification mutation consistency", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not let a GET started before mark-read restore stale unread state", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })));
    const { result } = renderHook(() => useNotificationRead(staleSnapshot));
    const pollVersion = result.current.mutationVersion.current;

    await act(async () => {
      await result.current.markRead(unreadItem);
    });

    expect(result.current.attentionCount).toBe(0);
    expect(result.current.items[0]).toMatchObject({ readAt: expect.any(String) });

    let applied = true;
    act(() => {
      applied = result.current.applySnapshotIfCurrent(staleSnapshot, pollVersion);
    });

    expect(applied).toBe(false);
    expect(result.current.attentionCount).toBe(0);
    expect(result.current.items[0]).toMatchObject({ readAt: expect.any(String) });
  });
});
