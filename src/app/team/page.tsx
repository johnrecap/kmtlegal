import { TeamPageView, teamMetadata } from "@/features/public-site/public-pages";

export const metadata = teamMetadata("en");

export default function TeamPage() {
  return <TeamPageView locale="en" />;
}
