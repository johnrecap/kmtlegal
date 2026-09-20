// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminUserActionPanel } from "@/features/admin/governance/governance-forms";
import { plan35UserGovernanceUiCopy } from "@/lib/ui-copy";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() })
}));

const initialUpdatedAt = "2026-09-13T10:00:00.000Z";
const savedUpdatedAt = "2026-09-13T10:05:00.000Z";

function renderPasswordForm() {
  render(
    <AdminUserActionPanel
      canChangePassword
      canManageClientAccount={false}
      clientProfile={null}
      roles={[{ id: "91000000-0000-4000-8000-000000000002", name: "Lawyer" }]}
      user={{
        id: "92000000-0000-4000-8000-000000000001",
        name: "Synthetic Lawyer",
        email: "synthetic@example.test",
        phone: null,
        roleId: "91000000-0000-4000-8000-000000000002",
        roleName: "Lawyer",
        status: "ACTIVE",
        locale: "ar",
        updatedAt: initialUpdatedAt
      }}
    />
  );
  // Password group renders open by default. The group trigger's accessible
  // name carries the description suffix, so the exact-name query matches
  // only the form submit.
}

function submitButton() {
  // `hidden: true` because the Animate Dialog keeps its exit mounted in
  // jsdom (Radix `hideOthers` leaves the background `aria-hidden`); the
  // close itself was verified in a real browser via the Phase 11 Playwright
  // harness. Exact name still matches only the form submit (the group
  // trigger carries the description suffix).
  return screen.getByRole("button", { hidden: true, name: "تغيير كلمة المرور" });
}

function fillPassword(password: string) {
  fireEvent.change(screen.getByLabelText("كلمة المرور الجديدة"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("تأكيد كلمة المرور"), { target: { value: password } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("admin user password form", () => {
  it("preserves the draft and requires explicit reload after a stale conflict", async () => {
    const password = "SyntheticPassword12!";
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({
      error: { code: "CONFLICT", message: plan35UserGovernanceUiCopy.password.stale }
    }), { status: 409, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    renderPasswordForm();

    await waitFor(() => expect(submitButton()).toBeEnabled());
    fillPassword(password);
    fireEvent.click(submitButton());
    // Destructive gate: the submit opens a confirmation dialog first.
    fireEvent.click(await screen.findByRole("button", { name: "تأكيد التغيير" }));

    await screen.findByText(plan35UserGovernanceUiCopy.password.stale);
    expect(screen.getByLabelText("كلمة المرور الجديدة")).toHaveValue(password);
    expect(submitButton()).toBeDisabled();
    expect(screen.getByRole("button", { hidden: true, name: plan35UserGovernanceUiCopy.password.reload })).toBeVisible();
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request).toMatchObject({ updatedAt: initialUpdatedAt, revokeSessions: true });
  });

  it("uses the safe version returned by a successful reset for the next submission", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: {
        id: "92000000-0000-4000-8000-000000000001",
        passwordUpdated: true,
        sessionsRevoked: false,
        updatedAt: savedUpdatedAt
      } }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: {
        id: "92000000-0000-4000-8000-000000000001",
        passwordUpdated: true,
        sessionsRevoked: false,
        updatedAt: "2026-09-13T10:10:00.000Z"
      } }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    renderPasswordForm();

    await waitFor(() => expect(submitButton()).toBeEnabled());
    fillPassword("SyntheticPassword12!");
    fireEvent.click(screen.getByLabelText("إنهاء الجلسات الحالية لهذا المستخدم بعد تغيير كلمة المرور"));
    fireEvent.click(submitButton());
    fireEvent.click(await screen.findByRole("button", { name: "تأكيد التغيير" }));
    await screen.findByText(plan35UserGovernanceUiCopy.password.saved);

    fillPassword("SyntheticPassword13!");
    fireEvent.click(submitButton());
    fireEvent.click(await screen.findByRole("button", { name: "تأكيد التغيير" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const firstRequest = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const secondRequest = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(firstRequest).toMatchObject({ updatedAt: initialUpdatedAt, revokeSessions: false });
    expect(secondRequest).toMatchObject({ updatedAt: savedUpdatedAt, revokeSessions: true });
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
