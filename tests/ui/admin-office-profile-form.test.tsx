// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfficeProfileSettingForm } from "@/features/admin/governance/governance-forms";
import { officeProfileSettingUiCopy } from "@/lib/ui-copy";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() })
}));

const initialValue = {
  firmName: "KMT Legal",
  publicPhone: "+201000000000",
  publicEmail: "office@example.test",
  primaryLocale: "ar"
};
const initialUpdatedAt = "2026-09-13T10:00:00.000Z";
const savedUpdatedAt = "2026-09-13T10:05:00.000Z";

function fillFirmName(value: string) {
  fireEvent.change(screen.getByLabelText("اسم المكتب"), { target: { value } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("office profile setting form", () => {
  it("sends the initial version and advances to the returned version across a server rerender", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { updatedAt: savedUpdatedAt } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { updatedAt: "2026-09-13T10:10:00.000Z" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));
    vi.stubGlobal("fetch", fetchMock);
    const view = render(<OfficeProfileSettingForm value={initialValue} updatedAt={initialUpdatedAt} />);

    fillFirmName("KMT Legal First");
    submit();
    await screen.findByText(officeProfileSettingUiCopy.saved);
    expect(refresh).toHaveBeenCalledTimes(1);

    fillFirmName("KMT Legal Draft During Refresh");
    view.rerender(
      <OfficeProfileSettingForm
        value={{ ...initialValue, firmName: "KMT Legal Server Rerender" }}
        updatedAt="2026-09-13T10:06:00.000Z"
      />
    );
    expect(screen.getByLabelText("اسم المكتب")).toHaveValue("KMT Legal Draft During Refresh");
    expect(screen.getByText(officeProfileSettingUiCopy.saved)).toBeVisible();

    submit();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const firstRequest = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const secondRequest = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(firstRequest).toMatchObject({ firmName: "KMT Legal First", updatedAt: initialUpdatedAt });
    expect(secondRequest).toMatchObject({ firmName: "KMT Legal Draft During Refresh", updatedAt: savedUpdatedAt });
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("retains the draft and requires an explicit reload after a conflict", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({
      error: { code: "CONFLICT", message: "Office profile changed after this form was loaded." }
    }), { status: 409, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<OfficeProfileSettingForm value={initialValue} updatedAt={initialUpdatedAt} />);

    fillFirmName("Unsaved conflict draft");
    submit();

    await screen.findByText(officeProfileSettingUiCopy.stale);
    expect(screen.getByLabelText("اسم المكتب")).toHaveValue("Unsaved conflict draft");
    expect(screen.getByLabelText("اسم المكتب")).toBeDisabled();
    expect(screen.getByRole("button", { name: "حفظ" })).toBeDisabled();
    expect(screen.getByRole("button", { name: officeProfileSettingUiCopy.reload })).toHaveAttribute("type", "button");
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request.updatedAt).toBe(initialUpdatedAt);
  });

  it("retains entered values after a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("synthetic network failure"); }));
    render(<OfficeProfileSettingForm value={initialValue} updatedAt={null} />);

    fillFirmName("Offline draft");
    submit();

    await screen.findByText(officeProfileSettingUiCopy.network);
    expect(screen.getByLabelText("اسم المكتب")).toHaveValue("Offline draft");
    expect(screen.getByRole("button", { name: "حفظ" })).toBeEnabled();
  });

  it("allows only one request for rapid duplicate submissions", async () => {
    let resolveRequest: (response: Response) => void = () => undefined;
    const pending = new Promise<Response>((resolve) => { resolveRequest = resolve; });
    const fetchMock = vi.fn(() => pending);
    vi.stubGlobal("fetch", fetchMock);
    render(<OfficeProfileSettingForm value={initialValue} updatedAt={initialUpdatedAt} />);

    const form = screen.getByRole("button", { name: "حفظ" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    fireEvent.submit(form!);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveRequest(new Response(JSON.stringify({ data: { updatedAt: savedUpdatedAt } }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
    await screen.findByText(officeProfileSettingUiCopy.saved);
  });
});
