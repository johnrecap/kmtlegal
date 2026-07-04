import { BookConsultationPageView, bookingMetadata } from "@/features/public-site/public-pages";

export const metadata = bookingMetadata("ar");
export const dynamic = "force-dynamic";

export default function ArabicBookConsultationPage() {
  return <BookConsultationPageView locale="ar" />;
}
