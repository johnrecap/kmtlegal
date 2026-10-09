import { metadataForPublicPath, renderPublicPath } from "@/features/public-site/public-pages";

export const revalidate = 900;
export const generateMetadata = () => metadataForPublicPath("en", ["our-firm"]);
export default function Page() { return renderPublicPath("en", ["our-firm"]); }
