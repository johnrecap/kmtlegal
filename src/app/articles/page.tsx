import { ArticlesPageView, articlesMetadata } from "@/features/public-site/public-pages";

export const metadata = articlesMetadata("en");
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ArticlesPage() {
  return <ArticlesPageView locale="en" />;
}
