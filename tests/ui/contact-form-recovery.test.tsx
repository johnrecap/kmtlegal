// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicContent } from "@/content/public-content";
import { ContactForm } from "@/features/public-site/contact-form";

function fillRequiredFields(locale: "ar" | "en") {
  fireEvent.change(screen.getByLabelText(getPublicContent(locale).contactForm.fullName), { target: { value: "Synthetic Contact" } });
  fireEvent.change(screen.getByLabelText(getPublicContent(locale).contactForm.email), { target: { value: "synthetic@example.test" } });
  fireEvent.change(screen.getByLabelText(getPublicContent(locale).contactForm.message), { target: { value: "Synthetic message retained after a network failure." } });
  fireEvent.click(screen.getByRole("checkbox"));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("public contact form recovery", () => {
  it.each(["en", "ar"] as const)("retains values and supports retry after a rejected %s request", async (locale) => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("synthetic offline"));
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm locale={locale} />);

    const submit = screen.getByRole("button", { name: getPublicContent(locale).contactForm.submit });
    await waitFor(() => expect(submit).toBeEnabled());
    fillRequiredFields(locale);
    fireEvent.click(submit);

    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent(getPublicContent(locale).contactForm.fallbackError);
    expect(screen.getByLabelText(getPublicContent(locale).contactForm.fullName)).toHaveValue("Synthetic Contact");
    expect(screen.getByLabelText(getPublicContent(locale).contactForm.message)).toHaveValue("Synthetic message retained after a network failure.");
    await waitFor(() => expect(submit).toBeEnabled());

    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ requestId: "synthetic-contact-success" }) });
    fireEvent.click(submit);
    await screen.findByRole("status");
    expect(screen.getByRole("status")).toHaveTextContent(getPublicContent(locale).contactForm.success);
    expect(screen.getByLabelText(getPublicContent(locale).contactForm.fullName)).toHaveValue("");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not send a duplicate request while the first request is pending", async () => {
    let resolveRequest: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolveRequest = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm locale="en" />);

    const submit = screen.getByRole("button", { name: getPublicContent("en").contactForm.submit });
    await waitFor(() => expect(submit).toBeEnabled());
    fillRequiredFields("en");
    const form = screen.getByTestId("contact-form");
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(fetchMock).toHaveBeenCalledOnce();

    resolveRequest?.({ ok: true, json: async () => ({ requestId: "synthetic-contact-pending" }) } as Response);
    await screen.findByRole("status");
  });

  it.each(["en", "ar"] as const)("maps server validation details to localized field errors (%s)", async (locale) => {
    const copy = getPublicContent(locale).contactForm;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            code: "VALIDATION_ERROR",
            message: "Contact form data is incomplete.",
            requestId: "req-validation",
            details: [
              { path: "email", message: "Invalid email", code: "invalid_string" },
              { path: "message", message: "Too short", code: "too_small" },
              { path: "consent", message: "Consent required", code: "invalid_literal" },
              { path: "unknownPath", message: "Unmapped detail", code: "custom" }
            ]
          }
        })
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ requestId: "synthetic-contact-retry" }) } as Response);
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm locale={locale} />);

    const submit = screen.getByRole("button", { name: copy.submit });
    await waitFor(() => expect(submit).toBeEnabled());
    fillRequiredFields(locale);
    fireEvent.click(submit);

    await waitFor(() => expect(screen.getByText(copy.fieldErrors.email)).toBeInTheDocument());
    expect(screen.getByText(copy.fieldErrors.message)).toBeInTheDocument();
    expect(screen.getByText(copy.fieldErrors.consent)).toBeInTheDocument();
    expect(screen.queryByText(copy.fieldErrors.fullName)).not.toBeInTheDocument();
    expect(screen.queryByText("Unmapped detail")).not.toBeInTheDocument();

    const emailField = screen.getByLabelText(copy.email);
    expect(emailField).toHaveAttribute("aria-invalid", "true");
    expect(emailField.getAttribute("aria-describedby")).toContain("-error");
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(emailField, { target: { value: "retained@example.test" } });
    await waitFor(() => expect(screen.queryByText(copy.fieldErrors.email)).not.toBeInTheDocument());
    expect(screen.getByText(copy.fieldErrors.message)).toBeInTheDocument();
    expect(screen.getByLabelText(copy.email)).toHaveValue("retained@example.test");

    fireEvent.click(submit);
    await screen.findByRole("status");
    expect(screen.getByRole("status")).toHaveTextContent(copy.success);
    expect(screen.queryByText(copy.fieldErrors.message)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
