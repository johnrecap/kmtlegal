import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/layout';
import { navForPath } from '@/content/public-content';
import { legalKnowledgeCopy } from '@/content/legal-knowledge-copy';
import { localizedPublicHref,type PublicLocale } from '@/lib/public-locale';
import { getKnowledge,knowledgeQuerySchema,listKnowledge } from '@/server/public/knowledge-service';
import { PublicSection,publicPanel } from './public-components';
import { cn } from '@/lib/cn';
const field='min-h-11 w-full rounded-lg border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)] p-3';
export async function LegalKnowledgePage({locale,query={}}:{locale:PublicLocale;query?:Record<string,string|string[]|undefined>}) {
 const c=legalKnowledgeCopy[locale];const parsed=knowledgeQuerySchema.safeParse(query);const filters=parsed.success?parsed.data:knowledgeQuerySchema.parse({});
 const items=await listKnowledge(locale,filters).catch(()=>null);
 return <PublicShell locale={locale} currentPath={localizedPublicHref('/legal-intelligence',locale)} navItems={navForPath('/articles',locale)}><PublicSection headingLevel="h1" title={c.title} description={c.description}>
 <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 <label>{c.query}<input className={field} name="q" defaultValue={filters.q} maxLength={120}/></label>
 <label>{c.type}<select className={field} name="type" defaultValue={filters.type}><option value="">{c.all}</option><option value="JUDGMENT">{c.types.JUDGMENT}</option><option value="LEGISLATION">{c.types.LEGISLATION}</option></select></label>
 {(['topic','reference','year','from','to'] as const).map(key=><label key={key}>{c[key]}<input className={field} name={key} defaultValue={filters[key]} type={key==='from'||key==='to'?'date':key==='year'?'number':'text'} maxLength={120}/></label>)}
 <button className={cn(field,'self-end font-semibold')} type="submit">{c.search}</button></form>
 <div className="mt-8 space-y-5">{items===null?<p role="alert">{c.error}</p>:items.length?items.map(item=><article key={item.id} className={cn(publicPanel,'p-6')}><p>{c.types[item.contentType as 'JUDGMENT'|'LEGISLATION']} · {item.referenceNumber} · {item.referenceYear}</p><h2 className="mt-3 text-2xl"><Link className="underline" href={localizedPublicHref('/legal-intelligence/'+item.slug,locale)}>{item.title}</Link></h2><p className="mt-3 leading-8">{item.excerpt}</p><p className="mt-4 text-sm">{c.reviewed}: {item.reviewedAt?.toISOString().slice(0,10)}</p></article>):<p>{c.empty}</p>}</div>
 </PublicSection></PublicShell>;
}
export async function LegalKnowledgeDetail({locale,slug}:{locale:PublicLocale;slug:string}) {
 const item=await getKnowledge(locale,slug);if(!item)notFound();const c=legalKnowledgeCopy[locale];const alternate=await getKnowledge(locale==='ar'?'en':'ar',slug);
 return <PublicShell languageHref={alternate?localizedPublicHref('/legal-intelligence/'+slug,locale==='ar'?'en':'ar'):null} locale={locale} currentPath={localizedPublicHref('/legal-intelligence/'+slug,locale)} navItems={navForPath('/articles',locale)}><PublicSection headingLevel="h1" title={item.title} description={item.excerpt}><p>{c.reference}: {item.referenceNumber} · {item.referenceYear}</p><p>{c.date}: {item.referenceDate?.toISOString().slice(0,10)}</p><p>{c.reviewed}: {item.reviewedAt?.toISOString().slice(0,10)}</p><p><a className="underline" href={item.sourceUrl??undefined} rel="noopener noreferrer">{c.source}: {item.sourceTitle}</a></p><div className="my-8 whitespace-pre-wrap leading-9">{item.content}</div><Link className="underline" href={localizedPublicHref('/legal-intelligence',locale)}>{c.back}</Link></PublicSection></PublicShell>;
}
