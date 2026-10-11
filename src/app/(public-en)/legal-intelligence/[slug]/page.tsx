import { metadataForPublicPath, renderPublicPath } from '@/features/public-site/public-pages';
type Props={params:Promise<{slug:string}>};
export const dynamic='force-dynamic';
export async function generateMetadata({params}:Props){return metadataForPublicPath('en',['legal-intelligence',(await params).slug]);}
export default async function Page({params}:Props){return renderPublicPath('en',['legal-intelligence',(await params).slug]);}
