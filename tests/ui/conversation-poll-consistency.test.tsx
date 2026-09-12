// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
const initialClient = { id: initialAdmin.id, status: "WAITING_CLIENT", subject: "Synthetic", lastMessageAt: "2026-09-13T00:00:00.000Z", messages: [{ id: "40000000-0000-4000-8000-000000000001", senderType: "STAFF" as const, body: "initial client message", createdAt: "2026-09-13T00:00:00.000Z", senderUser: { id: "staff", name: "Staff" } }] };
const updatedClient = { ...initialClient, status: "WAITING_STAFF", messages: [...initialClient.messages, { id: "40000000-0000-4000-8000-000000000002", senderType: "CLIENT" as const, body: "new client reply", createdAt: "2026-09-13T00:01:00.000Z", senderUser: null }] };

let poll: (() => Promise<void>) | undefined;
beforeEach(() => {
  poll = undefined;
  vi.spyOn(window, "setInterval").mockImplementation((callback) => { poll = callback as () => Promise<void>; return 1 as never; });
  vi.spyOn(window, "clearInterval").mockImplementation(() => undefined);
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("conversation poll consistency", () => {
  it("keeps an admin reply when an older in-flight poll resolves afterward", async () => {
    const stale = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn().mockReturnValueOnce(stale.promise).mockResolvedValueOnce(response({ data: updatedAdmin })));
    render(<AdminMessageThreadPanel initialThread={initialAdmin} assignees={[]} canAssign={false} canManage={false} canReply />);
    void poll?.();
    fireEvent.change(screen.getByPlaceholderText("اكتب رد الفريق للعميل..."), { target: { value: "new staff reply" } });
    fireEvent.submit(screen.getByPlaceholderText("اكتب رد الفريق للعميل...").closest("form")!);
    await screen.findByText("new staff reply");
    stale.resolve(response({ data: initialAdmin }));
    await waitFor(() => expect(screen.getByText("new staff reply")).toBeInTheDocument());
  });

  it("keeps the client draft on 409 and rejects an old poll after a successful reply", async () => {
    const stale = deferred<Response>();
    const copy = getClientContent("en");
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({ data: { items: [initialClient] } }))
      .mockResolvedValueOnce(response({ data: initialClient }))
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce(response({ data: updatedClient }))
      .mockResolvedValueOnce(response({ error: { code: "CONFLICT" } }, false)));
    render(<ClientTeamChatPanel locale="en" onBack={() => undefined} />);
    await screen.findByText("initial client message");
    void poll?.();
    const input = screen.getByLabelText(copy.teamChat.inputLabel);
    fireEvent.change(input, { target: { value: "new client reply" } });
    fireEvent.click(screen.getByRole("button", { name: copy.teamChat.send }));
    await screen.findByText("new client reply");
    stale.resolve(response({ data: initialClient }));
    await waitFor(() => expect(screen.getByText("new client reply")).toBeInTheDocument());

    fireEvent.change(input, { target: { value: "keep this draft" } });
    fireEvent.click(screen.getByRole("button", { name: copy.teamChat.send }));
    await screen.findByText(copy.teamChat.requestError);
    expect(input).toHaveValue("keep this draft");
  });
});
