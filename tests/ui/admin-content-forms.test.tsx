// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArticleForm, CaseStudyForm, SocialDraftForm } from "@/features/admin/content/content-forms";
import { contentLifecycleUiCopy } from "@/lib/ui-copy";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  refresh.mockReset();
});

describe("admin content lifecycle forms", () => {
  it("shows actual protected states and disables every edit control for a creator", async () => {
    const { rerender } = render(<ArticleForm article={{ id: "article-1", title: "Published", status: "PUBLISHED" }} canApprove={false} />);
    await waitFor(() => expect(screen.getByLabelText("الحالة")).toHaveValue("PUBLISHED"));
    expect(screen.getByText(/الحالة الحالية: منشور/)).toBeVisible();
    expect(screen.getByLabelText("عنوان المقال")).toBeDisabled();
    expect(screen.getByRole("button", { name: "حفظ المقال" })).toBeDisabled();

    rerender(<CaseStudyForm study={{ id: "study-1", title: "Approved", status: "APPROVED" }} canApprove={false} />);
    await waitFor(() => expect(screen.getByLabelText("الحالة")).toHaveValue("APPROVED"));
    expect(screen.getByText(/الحالة الحالية: معتمد/)).toBeVisible();
    expect(screen.getByRole("button", { name: "حفظ دراسة الحالة" })).toBeDisabled();

    rerender(<SocialDraftForm draft={{ id: "draft-1", title: "Scheduled", status: "SCHEDULED" }} canApprove={false} />);
    await waitFor(() => expect(screen.getByLabelText("الحالة")).toHaveValue("SCHEDULED"));
    expect(screen.getByText(/الحالة الحالية: مجدول/)).toBeVisible();
    expect(screen.getByRole("button", { name: "حفظ المسودة" })).toBeDisabled();
  });

  it("keeps rejected and archived records editable but requires an allowed target for creator rework", async () => {
    const { rerender } = render(<CaseStudyForm study={{ id: "study-2", title: "Rejected", status: "REJECTED" }} canApprove={false} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "حفظ دراسة الحالة" })).toBeEnabled());
    expect(screen.getByLabelText("الحالة")).toHaveValue("REJECTED");
    expect(screen.getByRole("option", { name: "مسودة" })).toBeVisible();
    expect(screen.queryByRole("option", { name: "معتمد" })).not.toBeInTheDocument();

    rerender(<ArticleForm article={{ id: "article-2", title: "Archived", status: "ARCHIVED" }} canApprove={false} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "حفظ المقال" })).toBeEnabled());
    expect(screen.getByLabelText("الحالة")).toHaveValue("ARCHIVED");
    expect(screen.getByRole("option", { name: "مسودة" })).toBeVisible();

    rerender(<SocialDraftForm draft={{ id: "draft-2", title: "Archived", status: "ARCHIVED" }} canApprove={false} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "حفظ المسودة" })).toBeEnabled());
    expect(screen.getByLabelText("الحالة")).toHaveValue("ARCHIVED");
    expect(screen.getByRole("option", { name: "مسودة" })).toBeVisible();
  });

  it("captures the form across await, resets only after create success, and blocks duplicate submission", async () => {
    let resolveRequest: (response: Response) => void = () => undefined;
    const pending = new Promise<Response>((resolve) => { resolveRequest = resolve; });
    const fetchMock = vi.fn(() => pending);
    vi.stubGlobal("fetch", fetchMock);
    render(<ArticleForm canApprove={false} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "إنشاء مقال" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("عنوان المقال"), { target: { value: "Synthetic article" } });
    const form = screen.getByRole("button", { name: "إنشاء مقال" }).closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => resolveRequest(new Response(JSON.stringify({ data: { id: "article-new" } }), { status: 201, headers: { "Content-Type": "application/json" } })));
    await screen.findByText("تم إنشاء المقال.");
    expect(screen.getByLabelText("عنوان المقال")).toHaveValue("");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("resets case-study and social forms only after their create handlers succeed", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { id: "created" } }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    }));
    vi.stubGlobal("fetch", fetchMock);

    const study = render(<CaseStudyForm canApprove={false} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "إنشاء دراسة حالة" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("عنوان دراسة الحالة"), { target: { value: "Synthetic study" } });
    fireEvent.submit(screen.getByRole("button", { name: "إنشاء دراسة حالة" }).closest("form")!);
    await screen.findByText("تم إنشاء دراسة الحالة.");
    expect(screen.getByLabelText("عنوان دراسة الحالة")).toHaveValue("");
    study.unmount();

    render(<SocialDraftForm canApprove={false} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "إنشاء مسودة" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("عنوان داخلي"), { target: { value: "Synthetic social draft" } });
    fireEvent.submit(screen.getByRole("button", { name: "إنشاء مسودة" }).closest("form")!);
    await screen.findByText("تم إنشاء مسودة السوشيال.");
    expect(screen.getByLabelText("عنوان داخلي")).toHaveValue("");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("preserves typed values after rejected submissions in all three forms", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({ error: { message: "Slug already exists." } }), {
      status: 409,
      headers: { "Content-Type": "application/json" }
    })));

    const article = render(<ArticleForm canApprove={false} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "إنشاء مقال" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("عنوان المقال"), { target: { value: "Retained article" } });
    fireEvent.submit(screen.getByRole("button", { name: "إنشاء مقال" }).closest("form")!);
    await screen.findByText(contentLifecycleUiCopy.duplicateSlug);
    expect(screen.getByLabelText("عنوان المقال")).toHaveValue("Retained article");
    article.unmount();

    const study = render(<CaseStudyForm canApprove={false} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "إنشاء دراسة حالة" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("عنوان دراسة الحالة"), { target: { value: "Retained study" } });
    fireEvent.submit(screen.getByRole("button", { name: "إنشاء دراسة حالة" }).closest("form")!);
    await screen.findByText(contentLifecycleUiCopy.duplicateSlug);
    expect(screen.getByLabelText("عنوان دراسة الحالة")).toHaveValue("Retained study");
    study.unmount();

    render(<SocialDraftForm canApprove={false} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "إنشاء مسودة" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("عنوان داخلي"), { target: { value: "Retained social draft" } });
    fireEvent.submit(screen.getByRole("button", { name: "إنشاء مسودة" }).closest("form")!);
    await screen.findByText(contentLifecycleUiCopy.duplicateSlug);
    expect(screen.getByLabelText("عنوان داخلي")).toHaveValue("Retained social draft");
    expect(refresh).not.toHaveBeenCalled();
  });
});
