import { BookConsultationPageView, bookingMetadata } from "@/features/public-site/public-pages";

export const metadata = bookingMetadata("en");
export const revalidate = 900;

export default function BookConsultationPage() {
  return <BookConsultationPageView locale="en" />;
}
