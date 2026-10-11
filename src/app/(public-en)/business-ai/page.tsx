import { metadataForPublicPath, renderPublicPath } from '@/features/public-site/public-pages';
export const dynamic="force-dynamic";
export function generateMetadata(){return metadataForPublicPath('en',['business-ai']);}
export default function Page(){return renderPublicPath('en',['business-ai']);}
