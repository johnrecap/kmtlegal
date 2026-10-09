"use client";

import { useSearchParams } from "next/navigation";
import { ConversationalBookingChat } from "@/features/public-site/conversational-booking-chat";
import { findPublicService, getPublicContent } from "@/content/public-content";
import { cn } from "@/lib/cn";
import type { PublicLocale } from "@/lib/public-locale";

export function ConsultationBookingChatFromQuery({ locale }: { locale: PublicLocale }) {
  const searchParams = useSearchParams();
  const requestedService = searchParams.get("service") ?? "";
  const initialService = findPublicService(locale, requestedService)?.slug ??
    [...getPublicContent("ar").legalServices, ...getPublicContent("en").legalServices].find(service => service.title === requestedService)?.slug;

  return <ConversationalBookingChat initialService={initialService} locale={locale} />;
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
    <p className={cn("mt-5 rounded border border-kmt-gold/25 bg-kmt-gold/10 p-3 text-sm text-[var(--kmt-public-text)]", className)}>
      {label}: {lawyer}
    </p>
  );
}
