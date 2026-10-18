// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ConversationalBookingChat } from "@/features/public-site/conversational-booking-chat";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("clears private answers after auth loss and rejects a late successful poll", async () => {
  const state = { locale: "ar", handoffState: "NONE", booking: null, draft: {}, revision: 1, accountReady: true, humanOwned: false, submitted: false,
    dialogue: { mode: "INQUIRY", consentAt: null, offerShown: false, accountAccess: false },
    turns: [{ messageId: "synthetic", userText: "طلباتي", assistantText: "PRIVATE_ACCOUNT_RESULT", status: "COMPLETED" }] };
  const reply = (data: unknown, status = 200) => ({ ok: status === 200, status, json: async () => ({ data }) });
  let stale!: (value: unknown) => void, denied!: (value: unknown) => void;
  const first = new Promise(resolve => { stale = resolve; }), second = new Promise(resolve => { denied = resolve; });
  const fetchMock = vi.fn().mockResolvedValueOnce(reply(state)).mockReturnValueOnce(first).mockReturnValueOnce(second);
  vi.stubGlobal("fetch", fetchMock);
  render(<ConversationalBookingChat locale="ar" layout="portal" />);
  await screen.findByText("PRIVATE_ACCOUNT_RESULT");
  await act(async () => { window.dispatchEvent(new Event("focus")); window.dispatchEvent(new Event("focus")); });
  expect(fetchMock).toHaveBeenCalledTimes(3);
  await act(async () => { denied(reply(null, 401)); });
  await waitFor(() => expect(screen.queryByText("PRIVATE_ACCOUNT_RESULT")).not.toBeInTheDocument());
  await act(async () => { stale(reply({ ...state, revision: 2 })); });
  expect(screen.queryByText("PRIVATE_ACCOUNT_RESULT")).not.toBeInTheDocument();
});
