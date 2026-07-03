import { notFound } from "next/navigation";
import { ConsultationPaymentReceiptDocument } from "@/features/payments/consultation-payment-receipt-document";
import { getPublicConsultationPaymentReceipt } from "@/server/payments/payment-receipt-service";

export const dynamic = "force-dynamic";

type PaymentReceiptPageProps = {
  searchParams?: Promise<{
    attemptId?: string;
    token?: string;
  }>;
};

export default async function ConsultationPaymentReceiptPage({ searchParams }: PaymentReceiptPageProps) {
  const params = await searchParams;
  const attemptId = params?.attemptId ?? "";
  const token = params?.token ?? "";

  if (!attemptId || !token) {
    notFound();
  }

  const receipt = await getReceipt(attemptId, token);
  if (!receipt) {
    notFound();
  }

  return <ConsultationPaymentReceiptDocument receipt={receipt} />;
}

async function getReceipt(attemptId: string, token: string) {
  try {
    return await getPublicConsultationPaymentReceipt({ attemptId, token });
  } catch {
    return null;
  }
}
