import { ArticlesPageView, articlesMetadata } from "@/features/public-site/public-pages";

export const metadata = articlesMetadata("en");
export const revalidate = 900;

export default async function ArticlesPage() {
  return <ArticlesPageView locale="en" />;
}
