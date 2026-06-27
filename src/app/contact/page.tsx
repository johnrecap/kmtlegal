import { ContactPageView, contactMetadata } from "@/features/public-site/public-pages";

export const metadata = contactMetadata("en");

export default function ContactPage() {
  return <ContactPageView locale="en" />;
}
