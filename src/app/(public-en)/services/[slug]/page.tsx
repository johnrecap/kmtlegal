import type { Metadata } from "next";
import {
  ServiceDetailPageView,
  publicServiceStaticParams,
  serviceDetailMetadata
} from "@/features/public-site/public-pages";

type ServiceDetailPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publicServiceStaticParams("en");
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return serviceDetailMetadata("en", slug);
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  return <ServiceDetailPageView locale="en" slug={slug} />;
}
