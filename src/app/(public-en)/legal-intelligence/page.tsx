import { metadataForPublicPath, renderPublicPath } from '@/features/public-site/public-pages';
export const dynamic='force-dynamic';
export function generateMetadata(){return metadataForPublicPath('en',['legal-intelligence']);}
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return renderPublicPath('en',['legal-intelligence'],await searchParams);}
