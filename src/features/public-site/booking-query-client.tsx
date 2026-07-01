"use client";

import { useSearchParams } from "next/navigation";
import { ConsultationBookingChat } from "@/features/public-site/consultation-booking-chat";
import { cn } from "@/lib/cn";
import type { PublicLocale } from "@/lib/public-locale";

export function ConsultationBookingChatFromQuery({ locale }: { locale: PublicLocale }) {
  const searchParams = useSearchParams();
  const initialService = searchParams.get("service") ?? undefined;

  return <ConsultationBookingChat initialService={initialService} locale={locale} />;
}

export function RequestedLawyerQueryNotice({
  className,
  label
}: {
  className?: string;
  label: string;
}) {
  const searchParams = useSearchParams();
  const lawyer = searchParams.get("lawyer");

  if (!lawyer) {
    return null;
  }

  return (
    <p className={cn("mt-5 rounded border border-kmt-gold/25 bg-kmt-gold/10 p-3 text-sm text-amber-100", className)}>
      {label}: {lawyer}
    </p>
  );
}
