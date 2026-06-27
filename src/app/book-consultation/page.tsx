import { BookConsultationPageView, bookingMetadata } from "@/features/public-site/public-pages";

export const metadata = bookingMetadata("en");

export default function BookConsultationPage({ searchParams }: { searchParams: { service?: string; lawyer?: string } }) {
  return <BookConsultationPageView locale="en" searchParams={searchParams} />;
}
