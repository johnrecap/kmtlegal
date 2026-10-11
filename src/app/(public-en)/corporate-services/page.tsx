import { metadataForPublicPath, renderPublicPath } from '@/features/public-site/public-pages';
export const revalidate=900;
export function generateMetadata(){return metadataForPublicPath('en',['corporate-services']);}
export default function Page(){return renderPublicPath('en',['corporate-services']);}
