import type { Metadata } from "next";
import { metadataForPublicPath, publicLawyerStaticParams, publicServiceStaticParams, renderPublicPath } from "@/features/public-site/public-pages";

type ArabicPublicPageProps = {
  params: Promise<{ path?: string[] }>;
};

export const revalidate = 900;

export function generateStaticParams() {
  const staticPages = [
    [],
    ["services"],
    ["team"],
    ["articles"],
    ["case-studies"],
    ["media"],
    ["contact"],
    ["privacy"],
    ["terms"]
  ];

  return [
    ...staticPages.map((path) => ({ path })),
    ...publicServiceStaticParams("ar").map(({ slug }) => ({ path: ["services", slug] })),
    ...publicLawyerStaticParams("ar").map(({ slug }) => ({ path: ["team", slug] }))
  ];
}

export async function generateMetadata({ params }: ArabicPublicPageProps): Promise<Metadata> {
  const { path } = await params;
  return metadataForPublicPath("ar", path ?? []);
}

export default async function ArabicPublicPage({ params }: ArabicPublicPageProps) {
  const { path } = await params;
  return renderPublicPath("ar", path ?? []);
}
