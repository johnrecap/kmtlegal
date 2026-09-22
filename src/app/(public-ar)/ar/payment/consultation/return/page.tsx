import { redirect } from "next/navigation";
import {
  ConsultationPaymentReturnPage,
  type PaymentReturnSearchParams
} from "@/features/payments/consultation-payment-return-page";

export const dynamic = "force-dynamic";

export default async function PaymentReturnRoute({
  searchParams
}: {
  searchParams?: Promise<PaymentReturnSearchParams>;
}) {
  const params = await searchParams;
  if (params?.locale === "en") {
    redirect(`/payment/consultation/return?${paymentQuery(params)}`);
  }

  return <ConsultationPaymentReturnPage locale="ar" params={params} />;
}

function paymentQuery(params: PaymentReturnSearchParams) {
  return new URLSearchParams(
    Object.entries(params)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "")
      .map(([key, value]) => [key, key === "locale" ? "en" : value])
  ).toString();
}
