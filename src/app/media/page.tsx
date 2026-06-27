import { MediaPageView, mediaMetadata } from "@/features/public-site/public-pages";

export const metadata = mediaMetadata("en");

export default function MediaPage() {
  return <MediaPageView locale="en" />;
}
