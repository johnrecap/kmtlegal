import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
import { BusinessDeskSection, ManagedServiceSection } from "@/features/public-site/business-desk";
import { NewServiceRequest, ServiceRequestWorkspace, type ServiceRequestView } from "@/features/portal/service-request-workspace";
import { ClientEmailVerification } from "@/features/public-site/client-email-verification";
import { ConversationalBookingChat } from "@/features/public-site/conversational-booking-chat";
import { RequestAlternativeTime } from "@/features/portal/request-alternative-time";
import { PaymentEntryForm } from "@/features/admin/finance/payment-entry-form";
import { PaymentProofForm } from "@/features/portal/payment-proof-form";
import { serviceRequestCopy } from "@/content/service-request-copy";
const request: ServiceRequestView = { id: "synthetic", reference: "CONTRACT-SYNTHETIC", kind: "CONTRACT_REVIEW", status: "DRAFT", revision: 0, quoteVersion: 0, paymentId: null, intake: { title: "Synthetic contract", purpose: "Synthetic review", language: "en", requestedDate: "", answers: {} }, quote: null, questionnaire: null, documents: [], events: [] };
describe("phase-five shared component consumers", () => {
  for (const locale of ["ar", "en"] as const) it(`${locale}: renders verified service states and branded company entries`, () => {
    const copy = serviceRequestCopy[locale];
    const draft = renderToStaticMarkup(<ServiceRequestWorkspace value={request} locale={locale} />);
    expect(draft).toContain(copy.save); expect(draft).toContain(copy.submit); expect(draft).not.toContain(copy.internal);
    expect(renderToStaticMarkup(<NewServiceRequest locale={locale} verified={false} healthAvailable={false} />)).toContain(copy.verify);
    const company = renderToStaticMarkup(<BusinessDeskSection locale={locale} />); expect(company).toContain("https://wa.me/201117416666?text="); expect(company).not.toContain("/checkout");
    expect(renderToStaticMarkup(<ManagedServiceSection locale={locale} health />)).toContain("/client/requests");
    expect(renderToStaticMarkup(<ConversationalBookingChat locale={locale} />)).toContain("textarea");
    expect(renderToStaticMarkup(<RequestAlternativeTime id="synthetic" mode="ONLINE" version={0} locale={locale} />)).toContain("button");
    expect(renderToStaticMarkup(<PaymentProofForm paymentId="synthetic" locale={locale} />)).toContain('type="file"');
  });
  it("keeps passwords in the separate verification form and records manual ledger entries", () => {
    expect(renderToStaticMarkup(<ClientEmailVerification />)).toContain('type="password"');
    const form = renderToStaticMarkup(<PaymentEntryForm paymentId="synthetic" currency="EGP" entries={[]} />); expect(form).toContain('name="receiptNumber"'); expect(form).toContain('name="amount"');
  });
});
