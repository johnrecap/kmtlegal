// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ConversationalBookingChat } from "@/features/public-site/conversational-booking-chat";
import { conversationCopy } from "@/content/conversation-copy";
import { assistantPolicyCopy } from "@/content/assistant-policy-copy";
import type { ConversationState } from "@/features/public-site/conversation-request";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function snapshot(locale: "ar" | "en" = "ar"): ConversationState {
  return { locale, revision: 1, handoffState: "NONE", booking: null, draft: {}, accountReady: false, humanOwned: false, submitted: false,
    dialogue: { mode: "INQUIRY", consentAt: null, offerShown: false, accountAccess: false }, turns: [] };
}

function response(data: ConversationState | null, status = 200) {
  return new Response(JSON.stringify({ data }), { status, headers: { "Content-Type": "application/json" } });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

it("shows the assistant preparing a reply in the transcript while the request is slow, then replaces it with the answer", async () => {
  const reply = deferred<Response>(), state = snapshot(), copy = conversationCopy.ar;
  let sent: { messageId: string; message: string };
  vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => {
    if (init?.method !== "POST") return Promise.resolve(response(state));
    sent = JSON.parse(String(init.body));
    return reply.promise;
  }));
  render(<ConversationalBookingChat locale="ar" />);
  await waitFor(() => expect(screen.getByRole("button", { name: "English" })).toBeEnabled());
  fireEvent.change(screen.getByLabelText(copy.message), { target: { value: "سؤال تجريبي" } });
  fireEvent.submit(screen.getByLabelText(copy.message).closest("form")!);
  expect(await within(screen.getByRole("log")).findByText(copy.waiting)).toBeVisible();
  expect(screen.getAllByText(copy.waiting)).toHaveLength(1);
  await act(async () => reply.resolve(response({ ...state, revision: 2, turns: [{ messageId: sent.messageId, recipient: "ASSISTANT", userText: sent.message, assistantText: "الإجابة التجريبية", status: "COMPLETED" }] })));
  expect(await screen.findByText("الإجابة التجريبية")).toBeVisible();
  expect(within(screen.getByRole("log")).queryByText(copy.waiting)).not.toBeInTheDocument();
});

it("shows feedback before a new session starts without submitting twice", async () => {
  const start = deferred<Response>(), state = snapshot(), copy = conversationCopy.ar;
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    if (init?.method !== "POST") return Promise.resolve(response(null));
    const body = JSON.parse(String(init.body));
    if (body.action === "start") return start.promise;
    return Promise.resolve(response({ ...state, turns: [{ messageId: body.messageId, recipient: "ASSISTANT", userText: body.message, status: "COMPLETED", assistantText: "رد واحد" }] }));
  });
  vi.stubGlobal("fetch", fetchMock);
  render(<ConversationalBookingChat locale="ar" />);
  await act(async () => {});
  fireEvent.change(screen.getByLabelText(copy.message), { target: { value: "ابدأ هنا" } });
  const form = screen.getByLabelText(copy.message).closest("form")!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(await within(screen.getByRole("log")).findByText(copy.waiting)).toBeVisible();
  await act(async () => start.resolve(response(state)));
  expect(await screen.findByText("رد واحد")).toBeVisible();
  expect(screen.getAllByText("ابدأ هنا")).toHaveLength(1);
  expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(2);
});

it.each(["ar", "en"] as const)("restores a PENDING reply in %s portal and removes feedback when polling completes it", async locale => {
  const state = snapshot(locale), copy = conversationCopy[locale];
  state.turns = [{ messageId: "restored", userText: "Saved question", assistantText: null, status: "PENDING", recipient: "ASSISTANT" }];
  const fetchMock = vi.fn().mockResolvedValue(response(state));
  vi.stubGlobal("fetch", fetchMock);
  render(<ConversationalBookingChat locale={locale} layout="portal" />);
  expect(await within(screen.getByRole("log")).findByText(copy.waiting)).toBeVisible();
  expect(screen.getAllByText(copy.waiting)).toHaveLength(1);
  fetchMock.mockResolvedValue(response({ ...state, revision: 2, turns: [{ ...state.turns[0], status: "COMPLETED", assistantText: "Restored answer" }] }));
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  expect(await screen.findByText("Restored answer")).toBeVisible();
  expect(within(screen.getByRole("log")).queryByText(copy.waiting)).not.toBeInTheDocument();
});

it.each(["FAILED", "COMPLETED", "HUMAN", "OFFICE_PENDING"])("does not label restored %s as assistant thinking", async status => {
  const state = snapshot(), office = status === "HUMAN" || status === "OFFICE_PENDING";
  state.turns = [{ messageId: "saved", userText: "Saved message", assistantText: null, status: status === "OFFICE_PENDING" ? "PENDING" : status, recipient: office ? "OFFICE" : "ASSISTANT" }];
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(state)));
  render(<ConversationalBookingChat locale="ar" />);
  await screen.findByText("Saved message");
  expect(within(screen.getByRole("log")).queryByText(conversationCopy.ar.waiting)).not.toBeInTheDocument();
});

it.each(["network", "proxy", "timeout", "denied"])("stops feedback after %s failure and preserves the draft", async failure => {
  const reply = deferred<Response>(), state = snapshot(), copy = conversationCopy.ar;
  vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => init?.method === "POST" ? reply.promise : Promise.resolve(response(state))));
  render(<ConversationalBookingChat locale="ar" />);
  await waitFor(() => expect(screen.getByRole("button", { name: "English" })).toBeEnabled());
  fireEvent.change(screen.getByLabelText(copy.message), { target: { value: "نص محفوظ" } });
  fireEvent.submit(screen.getByLabelText(copy.message).closest("form")!);
  await within(screen.getByRole("log")).findByText(copy.waiting);
  await act(async () => {
    if (failure === "network") reply.reject(new TypeError("Failed to fetch"));
    else reply.resolve(failure === "proxy"
      ? new Response("<html>upstream error</html>", { status: 502 })
      : failure === "denied" ? response(null, 401)
      : new Response(JSON.stringify({ error: { code: "AI_PROVIDER_TIMEOUT" } }), { status: 504 }));
  });
  await waitFor(() => expect(within(screen.getByRole("log")).queryByText(copy.waiting)).not.toBeInTheDocument());
  expect(screen.getByLabelText(copy.message)).toHaveValue("نص محفوظ");
  expect(await screen.findByText(copy.deliveryUnknown)).toBeVisible();
  if (failure === "denied") expect(screen.getByLabelText(copy.message)).toBeDisabled();
});

it("waits for retry reconciliation before showing feedback for the actual resend", async () => {
  const state = snapshot(), copy = conversationCopy.ar, reconciliation = deferred<Response>(), resend = deferred<Response>();
  state.turns = [{ messageId: "same-attempt", recipient: "ASSISTANT", userText: "Retry question", assistantText: null, status: "FAILED" }];
  let reads = 0, sentId = "";
  vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => {
    if (init?.method !== "POST") return ++reads === 1 ? Promise.resolve(response(state)) : reconciliation.promise;
    sentId = JSON.parse(String(init.body)).messageId;
    return resend.promise;
  }));
  render(<ConversationalBookingChat locale="ar" />);
  fireEvent.click(await screen.findByRole("button", { name: copy.retry }));
  expect(within(screen.getByRole("log")).queryByText(copy.waiting)).not.toBeInTheDocument();
  await act(async () => reconciliation.resolve(response(state)));
  expect(await within(screen.getByRole("log")).findByText(copy.waiting)).toBeVisible();
  expect(sentId).toBe("same-attempt");
  await act(async () => resend.resolve(response({ ...state, revision: 2, turns: [{ ...state.turns[0], status: "COMPLETED", assistantText: "Retry answer" }] })));
  expect(await screen.findByText("Retry answer")).toBeVisible();
  expect(screen.getAllByText("Retry question")).toHaveLength(1);
  expect(within(screen.getByRole("log")).queryByText(copy.waiting)).not.toBeInTheDocument();
});

it.each(["OFFICE", "set_locale", "account_access", "begin_booking"])("does not show assistant feedback during unrelated %s requests", async operation => {
  const state = snapshot(), copy = conversationCopy.ar, pending = deferred<Response>();
  vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => init?.method === "POST" ? pending.promise : Promise.resolve(response(state))));
  render(<ConversationalBookingChat locale="ar" />);
  await waitFor(() => expect(screen.getByRole("button", { name: "English" })).toBeEnabled());
  if (operation === "OFFICE") {
    fireEvent.click(screen.getByRole("button", { name: copy.toOffice }));
    fireEvent.change(screen.getByLabelText(copy.message), { target: { value: "Office message" } });
    fireEvent.submit(screen.getByLabelText(copy.message).closest("form")!);
    expect(await screen.findByText(copy.officeSending)).toBeVisible();
  } else fireEvent.click(screen.getByRole("button", { name: operation === "account_access" ? assistantPolicyCopy.ar.account : operation === "begin_booking" ? assistantPolicyCopy.ar.begin : "English" }));
  expect(within(screen.getByRole("log")).queryByText(copy.waiting)).not.toBeInTheDocument();
  await act(async () => pending.resolve(response(state)));
});

it("clears restored waiting feedback when session access is revoked", async () => {
  const state = snapshot(), copy = conversationCopy.ar;
  state.turns = [{ messageId: "private", userText: "Saved private question", assistantText: null, status: "PENDING" }];
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response(state)).mockResolvedValue(response(null, 401)));
  render(<ConversationalBookingChat locale="ar" layout="portal" />);
  await within(screen.getByRole("log")).findByText(copy.waiting);
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  await waitFor(() => expect(screen.getByLabelText(copy.message)).toBeDisabled());
  expect(within(screen.getByRole("log")).queryByText(copy.waiting)).not.toBeInTheDocument();
  expect(screen.queryByText("Saved private question")).not.toBeInTheDocument();
});
