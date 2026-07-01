import { ServicesPageView, servicesMetadata } from "@/features/public-site/public-pages";

export const metadata = servicesMetadata("en");

export default function ServicesPage() {
  return <ServicesPageView locale="en" />;
}
