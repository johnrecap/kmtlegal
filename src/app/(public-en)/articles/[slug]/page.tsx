import { articleDetailMetadata, ArticleDetailPageView } from "@/features/public-site/public-pages";

export const revalidate = 900;
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return articleDetailMetadata("en", (await params).slug); }
export default async function Page({ params }: Props) { return <ArticleDetailPageView locale="en" slug={(await params).slug} />; }
