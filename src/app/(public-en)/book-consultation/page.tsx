import { BookConsultationPageView, bookingMetadata } from "@/features/public-site/public-pages";

export const metadata = bookingMetadata("en");
export const dynamic = "force-dynamic";

export default function BookConsultationPage() {
  return <BookConsultationPageView locale="en" />;
}
