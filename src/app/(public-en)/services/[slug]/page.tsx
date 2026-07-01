import type { Metadata } from "next";
import {
  ServiceDetailPageView,
  publicServiceStaticParams,
  serviceDetailMetadata
} from "@/features/public-site/public-pages";

type ServiceDetailPageProps = { params: { slug: string } };

export function generateStaticParams() {
  return publicServiceStaticParams("en");
}

export function generateMetadata({ params }: ServiceDetailPageProps): Metadata {
  return serviceDetailMetadata("en", params.slug);
}

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  return <ServiceDetailPageView locale="en" slug={params.slug} />;
}
