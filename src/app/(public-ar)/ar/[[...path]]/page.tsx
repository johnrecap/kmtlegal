import type { Metadata } from "next";
import { metadataForPublicPath, publicLawyerStaticParams, publicServiceStaticParams, renderPublicPath } from "@/features/public-site/public-pages";

type ArabicPublicPageProps = {
  searchParams:Promise<Record<string,string|string[]|undefined>>;
  params: Promise<{ path?: string[] }>;
};

export const revalidate = 900;

export function generateStaticParams() {
  const staticPages = [
    [],
    ["our-firm"],
    ["industries"],
    ["articles"],
    ["services"],
    ["team"],
    ["contact"],
    ["privacy"],
    ["terms"],
    ["how-can-we-help"] ,
    ["corporate-services"] ,
    ["corporate-plans"] ,
    ["innovation"] ,
    ["legal-intelligence"] ,
    ["careers"] ,
    ["business-ai"]
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

export default async function ArabicPublicPage({ params, searchParams }: ArabicPublicPageProps) {
  const { path } = await params;
  return renderPublicPath("ar", path ?? [],path?.[0] === "legal-intelligence" ? await searchParams : {});
}
