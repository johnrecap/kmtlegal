// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ConversationAccountForm } from "@/features/public-site/conversation-account-form";
import { OfficeContactDialog } from "@/features/public-site/office-contact-dialog";
import { conversationCopy } from "@/content/conversation-copy";
import { getAuthContent } from "@/content/auth-content";

afterEach(cleanup);
it.each(["ar", "en"] as const)("%s: account draft survives close, credentials clear, and recovery uses the office", async locale => {
  const copy = conversationCopy[locale];
  const onRegister = vi.fn(async () => false);
  const props = { locale, initial: { fullName: "Synthetic Client", phone: "01012345678", email: "synthetic@example.invalid" }, busy: false, authenticated: false, panelOpen: true, onRegister, onAttach: vi.fn() };
  const view = render(<ConversationAccountForm {...props} />);
  fireEvent.change(screen.getByLabelText(copy.signupPassword), { target: { value: "SyntheticPassword12!" } });
  fireEvent.change(screen.getByLabelText(copy.confirmPassword), { target: { value: "MismatchPassword12!" } });
  fireEvent.click(screen.getByRole("button", { name: getAuthContent(locale).login.showPassword }));
  expect(screen.getByLabelText(copy.signupPassword)).toHaveAttribute("type", "text");
  fireEvent.submit(screen.getByRole("button", { name: copy.registerSubmit }).closest("form")!);
  expect(await screen.findByText(copy.passwordMismatch)).toBeVisible();
  expect(onRegister).not.toHaveBeenCalled();
  view.rerender(<ConversationAccountForm {...props} panelOpen={false} />);
  await waitFor(() => expect(screen.getByLabelText(copy.signupPassword)).toHaveValue(""));
  expect(screen.getByLabelText(copy.email)).toHaveValue(props.initial.email);
  expect(screen.getByLabelText(copy.confirmPassword)).toHaveValue("");
  expect(screen.getByLabelText(copy.signupPassword)).toHaveAttribute("type", "password");
  fireEvent.click(screen.getByRole("button", { name: copy.forgotPassword }));
  expect(screen.getByText(copy.recoveryHelp)).toBeVisible();
  expect(screen.queryByRole("button", { name: copy.attach })).not.toBeInTheDocument();
  view.rerender(<ConversationAccountForm {...props} authenticated />);
  expect(screen.getByRole("button", { name: copy.attach })).toBeVisible();
  expect(screen.queryByLabelText(copy.signupPassword)).not.toBeInTheDocument();
});

it("keeps optional office contact separate from account signup", () => {
  // The dialog is already used by chat; no account credentials belong in its contact form.
  const markup = renderToStaticMarkup(<OfficeContactDialog locale="ar" contact={null} accountReady={false} canSave error="" onClose={() => {}} onSave={async () => true} />);
  expect(markup).toContain(conversationCopy.ar.optionalPhone);
  expect(markup).not.toContain('type="password"');
});
