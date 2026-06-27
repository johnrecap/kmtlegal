import { HomePageView, homeMetadata } from "@/features/public-site/public-pages";

export const metadata = homeMetadata("en");
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function HomePage() {
  return <HomePageView locale="en" />;
}
