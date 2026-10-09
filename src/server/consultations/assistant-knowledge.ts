import { publicLegalServicesAr, publicLegalServicesEn } from "@/content/public-services";
import { publicOfficeProfile } from "@/content/public-office-profile";
import { approvedLegalExplanations } from "@/content/assistant-approved-knowledge";

export function assistantKnowledge(locale: "ar" | "en") {
  const prefix = locale === "ar" ? "/ar" : "";
  return {
    office: { source: `${prefix}/contact`, name: "KMT Legal", phone: publicOfficeProfile.phoneDisplay, email: publicOfficeProfile.email, location: publicOfficeProfile.address[locale], whatsapp: publicOfficeProfile.whatsappHref },
    services: (locale === "ar" ? publicLegalServicesAr : publicLegalServicesEn).map(s => ({ id: s.slug, source: `${prefix}/services/${s.slug}`, title: s.title, description: s.description, content: s.content, subServices: s.subServices, steps: s.steps, requiredDocuments: s.requiredDocuments })),
    procedures: { source: "owner-approved-published-booking-policy", booking: "Published phone/WhatsApp times are preapproved by the office. The customer's confirmation creates the appointment only after server availability checks. Name and phone suffice; an account is optional afterward. Legacy requests need staff approval. Fees remain separate; do not describe appointments as free.", contracts: "Office-led drafting/review; client accepts scope, fee and timing in the portal.", healthCheck: "Office-led company review and approved questionnaire/report; no automatic compliance score.", businessDesk: "Monthly company support is arranged personally on office WhatsApp. No automatic subscription billing.", requestsUrl: "/client/requests" },
    legalExplanations: approvedLegalExplanations.filter(item => item.locale === locale && item.approvedBy && item.source && Number.isFinite(Date.parse(item.approvedAt)))
  };
}
