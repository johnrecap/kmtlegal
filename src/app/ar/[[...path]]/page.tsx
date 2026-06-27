import type { Metadata } from "next";
import { metadataForPublicPath, renderPublicPath } from "@/features/public-site/public-pages";

type ArabicPublicPageProps = {
  params: { path?: string[] };
  searchParams: { service?: string; lawyer?: string };
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export function generateMetadata({ params }: ArabicPublicPageProps): Promise<Metadata> {
  return metadataForPublicPath("ar", params.path ?? []);
}

export default function ArabicPublicPage({ params, searchParams }: ArabicPublicPageProps) {
  return renderPublicPath("ar", params.path ?? [], searchParams);
}
