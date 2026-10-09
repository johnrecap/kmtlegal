import { ButtonLink } from "@/components/ui";
import { businessDeskCopy } from "@/content/business-desk-copy";
import { publicOfficeProfile } from "@/content/public-office-profile";
import { localizedPublicHref, type PublicLocale } from "@/lib/public-locale";
import { PublicSection } from "./public-components";

export function BusinessDeskSection({ locale }: { locale: PublicLocale }) {
  const copy = businessDeskCopy[locale];
  return <PublicSection eyebrow={copy.eyebrow} title={copy.title} description={copy.description} surface="muted"><div className="flex flex-wrap gap-3">
    <ButtonLink className="min-h-11 whitespace-normal text-center" href={`${publicOfficeProfile.whatsappHref}?text=${encodeURIComponent(copy.message)}`}>{copy.whatsapp}</ButtonLink>
    <ButtonLink className="min-h-11 whitespace-normal text-center" variant="secondary" href={`${localizedPublicHref("/services/corporate-business-services", locale)}#legal-health-check`}>{copy.health}</ButtonLink>
  </div></PublicSection>;
}

export function ManagedServiceSection({ locale, health = false }: { locale: PublicLocale; health?: boolean }) {
  const copy = businessDeskCopy[locale];
  return <div id={health ? "legal-health-check" : "contract-request"} className="scroll-mt-28"><PublicSection eyebrow="KMT Legal" title={health ? copy.health : copy.contracts} description={health ? copy.healthDescription : copy.contractDescription}>
    <div className="flex flex-wrap gap-3"><ButtonLink className="min-h-11 whitespace-normal" href="/client/requests">{copy.request}</ButtonLink><ButtonLink className="min-h-11 whitespace-normal" variant="secondary" href={localizedPublicHref("/book-consultation", locale)}>{copy.account}</ButtonLink></div><p className="mt-5 text-sm text-[var(--kmt-public-muted)]">{copy.officeReview}</p>
  </PublicSection></div>;
}
