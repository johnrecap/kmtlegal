import { metadataForPublicPath, renderPublicPath } from '@/features/public-site/public-pages';
export const revalidate=900;
export function generateMetadata(){return metadataForPublicPath('en',['how-can-we-help']);}
export default function Page(){return renderPublicPath('en',['how-can-we-help']);}
