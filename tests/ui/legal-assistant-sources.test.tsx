// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ConversationalBookingChat } from "@/features/public-site/conversational-booking-chat";
import { legalAssistantCopy } from "@/content/legal-assistant-copy";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it.each(["ar", "en"] as const)("renders safe, accessible official citations and old turns in %s", async locale => {
  const state = { locale, handoffState: "NONE", booking: null, draft: {}, revision: 1, accountReady: false, humanOwned: false, submitted: false,
    dialogue: { mode: "INQUIRY", consentAt: null, offerShown: false, accountAccess: false },
    turns: [{ messageId: "old", userText: "Old question", assistantText: "Old answer", status: "COMPLETED" },
      { messageId: "new", userText: "Legal question", assistantText: "Conditional explanation [S1]", status: "COMPLETED", sources: [
        { id: "S1", title: "Official authority", url: "https://cc.gov.eg/", jurisdiction: "EG", retrievedAt: "2026-10-18T10:00:00.000Z" },
        { id: "S2", title: "Unsafe citation", url: "javascript:alert(1)", jurisdiction: "EG", retrievedAt: "invalid" }
      ] }] };
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ data: state }) })));
  render(<ConversationalBookingChat locale={locale} layout="portal" />);
  await screen.findByText("Old answer");
  const link = await screen.findByRole("link", { name: "[S1] Official authority" });
  expect(link).toHaveAttribute("href", "https://cc.gov.eg/"); expect(link).toHaveAttribute("target", "_blank"); expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getByRole("navigation", { name: legalAssistantCopy[locale].sources })).toHaveTextContent(legalAssistantCopy[locale].accessed);
  expect(screen.queryByRole("link", { name: /Unsafe/ })).not.toBeInTheDocument();
});
