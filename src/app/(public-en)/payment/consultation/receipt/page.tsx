import { notFound, redirect } from "next/navigation";
import {
  ConsultationPaymentReceiptPage,
  getPublicReceiptOrNull,
  type PaymentReceiptSearchParams
} from "@/features/payments/consultation-payment-receipt-page";

export const dynamic = "force-dynamic";

export default async function PaymentReceiptRoute({
  searchParams
}: {
  searchParams?: Promise<PaymentReceiptSearchParams>;
}) {
  const params = await searchParams;
  const attemptId = params?.attemptId ?? "";
  const token = params?.token ?? "";
  const receipt = attemptId && token ? await getPublicReceiptOrNull(attemptId, token) : null;
  if (!receipt) notFound();
  if (receipt.locale === "ar") {
    redirect(`/ar/payment/consultation/receipt?${receiptQuery(params ?? {})}`);
  }

  return <ConsultationPaymentReceiptPage locale="en" params={params} receipt={receipt} />;
}

function receiptQuery(params: PaymentReceiptSearchParams) {
  return new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "")
  ).toString();
}
