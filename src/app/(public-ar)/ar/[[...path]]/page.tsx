import type { Metadata } from "next";
import { metadataForPublicPath, publicLawyerStaticParams, publicServiceStaticParams, renderPublicPath } from "@/features/public-site/public-pages";

type ArabicPublicPageProps = {
  params: { path?: string[] };
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
    ["book-consultation"],
    ["privacy"],
    ["terms"]
  ];

  return [
    ...staticPages.map((path) => ({ path })),
    ...publicServiceStaticParams("ar").map(({ slug }) => ({ path: ["services", slug] })),
    ...publicLawyerStaticParams("ar").map(({ slug }) => ({ path: ["team", slug] }))
  ];
}

export function generateMetadata({ params }: ArabicPublicPageProps): Promise<Metadata> {
  return metadataForPublicPath("ar", params.path ?? []);
}

export default function ArabicPublicPage({ params }: ArabicPublicPageProps) {
  return renderPublicPath("ar", params.path ?? []);
}
