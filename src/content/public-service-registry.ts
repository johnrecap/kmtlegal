/** Shared public IDs; internal booking categories remain unchanged. */
export const publicServiceSlugs = ["legal-consultation", "company-formation", "corporate-business-services", "contracts", "real-estate-legal-support", "claims-collections", "criminal-law", "civil-law", "family-personal-status", "administrative-law", "litigation-appeals", "employment", "investment", "tax-customs", "banking-finance", "arbitration", "ip-technology", "compensation-insurance", "immigration-nationality", "transport", "specialist-practices"] as const;
export type PublicServiceSlug = typeof publicServiceSlugs[number];
export const directServiceSlugs: readonly string[] = ['legal-consultation','company-formation','contracts'];
export const isPracticeService = (slug: string) => !directServiceSlugs.includes(slug);
export const contentHubSlugs = ['how-can-we-help','corporate-services','corporate-plans','innovation','legal-intelligence','careers','business-ai'] as const;
