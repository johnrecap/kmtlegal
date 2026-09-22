// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminMessageThreadPanel } from "@/features/admin/messages/admin-message-thread-panel";
import { ClientTeamChatPanel } from "@/features/client/client-team-chat-panel";
import { getClientContent } from "@/content/client-content";

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  return { promise: new Promise<T>((next) => { resolve = next; }), resolve };
}
function response(data: unknown, ok = true) {
  return { ok, json: async () => data } as Response;
}

const initialAdmin = {
  id: "10000000-0000-4000-8000-000000000001", status: "WAITING_STAFF", subject: "Synthetic", lastMessageAt: "2026-09-13T00:00:00.000Z", closedAt: null,
  client: { id: "20000000-0000-4000-8000-000000000001", fullName: "Synthetic Client", phone: "201000000000", email: "client@example.test" }, assignedTo: null,
  messages: [{ id: "30000000-0000-4000-8000-000000000001", senderType: "CLIENT" as const, body: "initial admin message", createdAt: "2026-09-13T00:00:00.000Z", senderUser: null }]
};
const updatedAdmin = { ...initialAdmin, status: "WAITING_CLIENT", messages: [...initialAdmin.messages, { id: "30000000-0000-4000-8000-000000000002", senderType: "STAFF" as const, body: "new staff reply", createdAt: "2026-09-13T00:01:00.000Z", senderUser: { id: "staff", name: "Staff" } }] };
const nextAdminPoll = { ...updatedAdmin, messages: [...updatedAdmin.messages, { id: "30000000-0000-4000-8000-000000000003", senderType: "CLIENT" as const, body: "newer server poll", createdAt: "2026-09-13T00:02:00.000Z", senderUser: null }] };
const initialClient = { id: initialAdmin.id, status: "WAITING_CLIENT", subject: "Synthetic", lastMessageAt: "2026-09-13T00:00:00.000Z", messages: [{ id: "40000000-0000-4000-8000-000000000001", senderType: "STAFF" as const, body: "initial client message", createdAt: "2026-09-13T00:00:00.000Z", senderUser: { id: "staff", name: "Staff" } }] };
const updatedClient = { ...initialClient, status: "WAITING_STAFF", messages: [...initialClient.messages, { id: "40000000-0000-4000-8000-000000000002", senderType: "CLIENT" as const, body: "new client reply", createdAt: "2026-09-13T00:01:00.000Z", senderUser: null }] };

let poll: (() => Promise<void>) | undefined;
beforeEach(() => {
  poll = undefined;
  const activeIntervals = new Map<number, () => Promise<void>>();
  const activeTimeouts = new Map<number, () => Promise<void>>();
  let nextIntervalId = -10000;
  let nextTimeoutId = -1;
  const nativeSetInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);
  const nativeSetTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);
  vi.spyOn(window, "setInterval").mockImplementation(((...parameters: Parameters<typeof window.setInterval>) => {
    const [callback, delay, ...args] = parameters;
    if (Number(delay) >= 5000) {
      const intervalId = nextIntervalId--;
      activeIntervals.set(intervalId, callback as () => Promise<void>);
      poll = callback as () => Promise<void>;
      return intervalId;
    }
    return nativeSetInterval(callback, delay, ...args);
  }) as typeof window.setInterval);
  vi.spyOn(window, "clearInterval").mockImplementation((intervalId) => {
    const numericId = Number(intervalId);
    if (activeIntervals.has(numericId)) {
      activeIntervals.delete(numericId);
      poll = Array.from(activeIntervals.values()).at(-1) ?? Array.from(activeTimeouts.values()).at(-1);
      return;
    }
    nativeClearInterval(intervalId);
  });
  vi.spyOn(window, "setTimeout").mockImplementation(((...parameters: Parameters<typeof window.setTimeout>) => {
    const [callback, delay, ...args] = parameters;
    if (Number(delay) >= 5000) {
      const timeoutId = nextTimeoutId--;
      activeTimeouts.set(timeoutId, callback as () => Promise<void>);
      poll = callback as () => Promise<void>;
      return timeoutId;
    }
    return nativeSetTimeout(callback, delay, ...args);
  }) as typeof window.setTimeout);
  vi.spyOn(window, "clearTimeout").mockImplementation((timeoutId) => {
    const numericId = Number(timeoutId);
    if (activeTimeouts.has(numericId)) {
      activeTimeouts.delete(numericId);
      poll = Array.from(activeTimeouts.values()).at(-1) ?? Array.from(activeIntervals.values()).at(-1);
      return;
    }
    nativeClearTimeout(timeoutId);
  });
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("conversation poll consistency", () => {
  it("keeps an admin reply when an older in-flight poll resolves afterward", async () => {
    const stale = deferred<Response>();
    const fetchMock = vi.fn().mockReturnValueOnce(stale.promise).mockResolvedValueOnce(response({ data: updatedAdmin }));
    vi.stubGlobal("fetch", fetchMock);
    render(<React.StrictMode><AdminMessageThreadPanel initialThread={initialAdmin} assignees={[]} canAssign={false} canManage={false} canReply /></React.StrictMode>);
    const pendingPoll = poll!();
    await Promise.resolve();
    await poll!();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByPlaceholderText("اكتب رد الفريق للعميل..."), { target: { value: "new staff reply" } });
    fireEvent.submit(screen.getByPlaceholderText("اكتب رد الفريق للعميل...").closest("form")!);
    await screen.findByText("new staff reply");
    await act(async () => {
      stale.resolve(response({ data: initialAdmin }));
      await pendingPoll;
    });
    await waitFor(() => expect(screen.getByText("new staff reply")).toBeInTheDocument());
  });

  it("keeps an admin PATCH result when an older GET resolves afterward", async () => {
    const stale = deferred<Response>();
    const fetchMock = vi.fn((_: RequestInfo | URL, init?: RequestInit) =>
      init?.method === "PATCH" ? Promise.resolve(response({ data: updatedAdmin })) : stale.promise
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<React.StrictMode><AdminMessageThreadPanel initialThread={initialAdmin} assignees={[]} canAssign={false} canManage canReply /></React.StrictMode>);
    const pendingPoll = poll!();
    fireEvent.change(screen.getByLabelText("الحالة"), { target: { value: "WAITING_CLIENT" } });
    await waitFor(() => expect(screen.getByLabelText("الحالة")).toHaveValue("WAITING_CLIENT"));
    fireEvent.click(screen.getByRole("button", { name: "حفظ التغييرات" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH")).toBe(true));
    await act(async () => {
      stale.resolve(response({ data: initialAdmin }));
      await pendingPoll;
    });
    expect(screen.getByLabelText("الحالة")).toHaveValue("WAITING_CLIENT");
  });

  it("does not overlap an admin POST with a PATCH", async () => {
    const pendingReply = deferred<Response>();
    const fetchMock = vi.fn((_: RequestInfo | URL, __?: RequestInit) => pendingReply.promise);
    vi.stubGlobal("fetch", fetchMock);
    render(<React.StrictMode><AdminMessageThreadPanel initialThread={initialAdmin} assignees={[]} canAssign={false} canManage canReply /></React.StrictMode>);
    const replyInput = screen.getByPlaceholderText("اكتب رد الفريق للعميل...");
    fireEvent.change(replyInput, { target: { value: "pending staff reply" } });
    fireEvent.submit(replyInput.closest("form")!);
    await waitFor(() => expect(screen.getByLabelText("الحالة")).toBeDisabled());
    fireEvent.change(screen.getByLabelText("الحالة"), { target: { value: "CLOSED" } });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH")).toBe(false);
    await act(async () => {
      pendingReply.resolve(response({ data: updatedAdmin }));
      await Promise.resolve();
    });
    await screen.findByText("new staff reply");
  });

  it("applies a slow poll when no write supersedes it, then allows the next poll", async () => {
    const slow = deferred<Response>();
    let mode: "slow" | "next" = "slow";
    const fetchMock = vi.fn(() => mode === "slow" ? slow.promise : Promise.resolve(response({ data: nextAdminPoll })));
    vi.stubGlobal("fetch", fetchMock);
    render(<React.StrictMode><AdminMessageThreadPanel initialThread={initialAdmin} assignees={[]} canAssign={false} canManage={false} canReply /></React.StrictMode>);
    const slowPoll = poll!();
    await Promise.resolve();
    slow.resolve(response({ data: updatedAdmin }));
    await act(async () => { await slowPoll; });
    await screen.findByText("new staff reply");
    mode = "next";
    const nextPoll = await waitFor(() => {
      expect(poll).toBeTypeOf("function");
      return poll!;
    });
    await act(async () => { await nextPoll(); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await screen.findByText("newer server poll");
  });

  it("keeps the client draft on 409 and rejects an old poll after a successful reply", async () => {
    const stale = deferred<Response>();
    const copy = getClientContent("en");
    let pollMode = false;
    let postCount = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === "POST") {
        postCount += 1;
        return Promise.resolve(postCount === 1
          ? response({ data: updatedClient })
          : response({ error: { code: "CONFLICT" } }, false));
      }
      if (url === "/api/client/messages") {
        return Promise.resolve(response({ data: { items: [initialClient] } }));
      }
      return pollMode ? stale.promise : Promise.resolve(response({ data: initialClient }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<React.StrictMode><ClientTeamChatPanel locale="en" onBack={() => undefined} /></React.StrictMode>);
    await screen.findByText("initial client message");
    const callsBeforePoll = fetchMock.mock.calls.length;
    pollMode = true;
    const pendingPoll = poll!();
    await Promise.resolve();
    await poll!();
    expect(fetchMock).toHaveBeenCalledTimes(callsBeforePoll + 1);
    const input = screen.getByLabelText(copy.teamChat.inputLabel);
    fireEvent.change(input, { target: { value: "new client reply" } });
    fireEvent.click(screen.getByRole("button", { name: copy.teamChat.send }));
    await screen.findByText("new client reply");
    await act(async () => {
      stale.resolve(response({ data: initialClient }));
      await pendingPoll;
    });
    await waitFor(() => expect(screen.getByText("new client reply")).toBeInTheDocument());

    fireEvent.change(input, { target: { value: "keep this draft" } });
    fireEvent.click(screen.getByRole("button", { name: copy.teamChat.send }));
    await screen.findByText(copy.teamChat.requestError);
    expect(input).toHaveValue("keep this draft");
  });

  it("keeps a newer client draft typed while an earlier reply is pending", async () => {
    const pendingReply = deferred<Response>();
    const copy = getClientContent("en");
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") return pendingReply.promise;
      return String(input) === "/api/client/messages"
        ? Promise.resolve(response({ data: { items: [initialClient] } }))
        : Promise.resolve(response({ data: initialClient }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<React.StrictMode><ClientTeamChatPanel locale="en" onBack={() => undefined} /></React.StrictMode>);
    await screen.findByText("initial client message");
    const input = screen.getByLabelText(copy.teamChat.inputLabel);
    fireEvent.change(input, { target: { value: "first client reply" } });
    fireEvent.click(screen.getByRole("button", { name: copy.teamChat.send }));
    fireEvent.change(input, { target: { value: "newer unsent draft" } });
    await act(async () => {
      pendingReply.resolve(response({ data: updatedClient }));
      await Promise.resolve();
    });
    await screen.findByText("new client reply");
    expect(input).toHaveValue("newer unsent draft");
  });

  it("reloads the current locale after a first reply completes in an older locale context", async () => {
    const pendingReply = deferred<Response>();
    let replyPersisted = false;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") return pendingReply.promise;
      if (String(input) === "/api/client/messages") {
        return Promise.resolve(response({ data: { items: replyPersisted ? [updatedClient] : [] } }));
      }
      return Promise.resolve(response({ data: updatedClient }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { rerender } = render(<ClientTeamChatPanel locale="en" onBack={() => undefined} />);
    const englishCopy = getClientContent("en");
    await screen.findByText(englishCopy.teamChat.empty);
    const englishInput = screen.getByLabelText(englishCopy.teamChat.inputLabel);
    fireEvent.change(englishInput, { target: { value: "first message across locale" } });
    fireEvent.click(screen.getByRole("button", { name: englishCopy.teamChat.send }));
    rerender(<ClientTeamChatPanel locale="ar" onBack={() => undefined} />);
    replyPersisted = true;
    await act(async () => {
      pendingReply.resolve(response({ data: updatedClient }));
      await Promise.resolve();
    });
    await screen.findByText("new client reply");
    expect(screen.getByLabelText(getClientContent("ar").teamChat.inputLabel)).toHaveValue("");
  });
});
