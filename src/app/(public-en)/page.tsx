import { HomePageView, homeMetadata } from "@/features/public-site/public-pages";

export const metadata = homeMetadata("en");
export const revalidate = 900;

export default async function HomePage() {
  return <HomePageView locale="en" />;
}
