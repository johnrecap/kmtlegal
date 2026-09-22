import { notFound } from "next/navigation";
import { ConsultationPaymentReceiptDocument } from "@/features/payments/consultation-payment-receipt-document";
import type { PublicLocale } from "@/lib/public-locale";
import {
  getPublicConsultationPaymentReceipt,
  type PaymentReceiptView
} from "@/server/payments/payment-receipt-service";

export type PaymentReceiptSearchParams = {
  attemptId?: string;
  token?: string;
};

export async function ConsultationPaymentReceiptPage({
  locale,
  params,
  receipt: knownReceipt
}: {
  locale: PublicLocale;
  params?: PaymentReceiptSearchParams;
  receipt?: PaymentReceiptView;
}) {
  const attemptId = params?.attemptId ?? "";
  const token = params?.token ?? "";

  if (!attemptId || !token) {
    notFound();
  }

  const receipt = knownReceipt ?? (await getPublicReceiptOrNull(attemptId, token));
  if (!receipt) {
    notFound();
  }

  return <ConsultationPaymentReceiptDocument locale={locale} receipt={receipt} />;
}

export async function getPublicReceiptOrNull(attemptId: string, token: string) {
  try {
    return await getPublicConsultationPaymentReceipt({ attemptId, token });
  } catch {
    return null;
  }
}
