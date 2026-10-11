import { unstable_noStore as noStore } from "next/cache";
import { BusinessFormationInterview } from "./business-formation-interview";
import Link from 'next/link';
import { PublicShell } from '@/components/layout';
import { navForPath } from '@/content/public-content';
import { publicHub, type ContentHubSlug } from '@/content/public-hubs';
import { officeAssets } from '@/content/office-assets';
import { siteCompletionCopy } from '@/content/site-completion-copy';
import { publicOfficeProfile } from '@/content/public-office-profile';
import { localizedPublicHref, type PublicLocale } from '@/lib/public-locale';
import { BusinessDeskSection } from './business-desk';
import { PageHero, PublicSection, publicPanel, publicMutedText } from './public-components';
import { cn } from '@/lib/cn';

export function ContentHubPage({locale,slug}:{locale:PublicLocale;slug:ContentHubSlug}) {
 if(slug==='business-ai')noStore();
 const c=publicHub(slug,locale), shared=siteCompletionCopy[locale];
 return <PublicShell locale={locale} currentPath={localizedPublicHref('/'+slug,locale)} navItems={navForPath('/'+slug,locale)}>
  <PageHero eyebrow="KMT Legal" title={c.title} description={c.description} image={officeAssets.meeting.src} imageAlt={shared.meetingAlt} size="compact"/>
  <PublicSection title={c.title}>
   {slug==='business-ai'?<BusinessFormationInterview locale={locale}/>:null}
   <div className="grid gap-5 md:grid-cols-2">{c.sections.map(s=><section key={s.title} className={cn(publicPanel,'p-6')}>
    <h2 className="text-xl font-semibold">{s.title}</h2><p className={cn(publicMutedText,'mt-3 leading-8')}>{s.body}</p>
    {s.href?<Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-[var(--kmt-public-gold)] underline underline-offset-4 focus-visible:outline" href={localizedPublicHref(slug==='how-can-we-help'?'/book-consultation?service='+s.href:s.href,locale)}>{slug==='how-can-we-help'?shared.next:s.title}</Link>:null}
   </section>)}</div>
   {slug==='careers'?<div className="mt-8 flex flex-wrap gap-6"><a className="underline" href={publicOfficeProfile.emailHref}><bdi>{publicOfficeProfile.email}</bdi></a><Link className="underline" href={localizedPublicHref('/privacy',locale)}>{shared.privacy}</Link></div>:null}
  </PublicSection>
  {slug==='corporate-services'||slug==='corporate-plans'?<BusinessDeskSection locale={locale}/>:null}
 </PublicShell>;
}
