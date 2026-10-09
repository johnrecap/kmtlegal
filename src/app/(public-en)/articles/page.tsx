import { metadataForPublicPath, renderPublicPath } from "@/features/public-site/public-pages";

export const revalidate = 900;
export const generateMetadata = () => metadataForPublicPath("en", ["articles"]);
export default function Page() { return renderPublicPath("en", ["articles"]); }
