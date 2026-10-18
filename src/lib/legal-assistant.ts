import { z } from "zod";

// Explicit authorities, never domains or URLs supplied by a customer/model.
export const legalAuthorities: Record<string, readonly string[]> = {
  EG: ["cc.gov.eg", "elpai.idsc.gov.eg", "idsc.gov.eg", "moj.gov.eg", "gafi.gov.eg", "mift.gov.eg", "eta.gov.eg", "fra.gov.eg", "parliament.gov.eg", "psm.gov.eg"],
  SA: ["laws.boe.gov.sa", "moj.gov.sa", "hrsd.gov.sa", "zatca.gov.sa"],
  AE: ["uaelegislation.gov.ae", "moj.gov.ae", "u.ae", "mohre.gov.ae"],
  GB: ["legislation.gov.uk", "gov.uk", "judiciary.uk"],
  US: ["uscode.house.gov", "congress.gov", "uscourts.gov", "supremecourt.gov", "govinfo.gov"],
  FR: ["legifrance.gouv.fr", "service-public.fr", "justice.fr"],
  DE: ["gesetze-im-internet.de", "bundesverfassungsgericht.de", "bundesgerichtshof.de"],
  CA: ["laws-lois.justice.gc.ca", "justice.gc.ca", "scc-csc.ca"],
  AU: ["legislation.gov.au", "ag.gov.au", "hcourt.gov.au"],
  IN: ["indiacode.nic.in", "legislative.gov.in", "sci.gov.in"]
};
export function officialLegalUrl(value: string, jurisdiction: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      (legalAuthorities[jurisdiction] ?? []).some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch { return false; }
}
export const legalSourceSchema = z.strictObject({
  id: z.string().regex(/^S[1-5]$/), title: z.string().min(1).max(300), url: z.url().max(2048),
  retrievedAt: z.iso.datetime(), jurisdiction: z.string().regex(/^[A-Z]{2}$/)
}).refine(source => officialLegalUrl(source.url, source.jurisdiction));
export type LegalSource = z.infer<typeof legalSourceSchema>;
export const LEGAL_METADATA_MARKER = "KMT_LEGAL_SOURCES:";
export function legalSourceMetadata(sources: LegalSource[]) {
  return { role: "system" as const, content: LEGAL_METADATA_MARKER + JSON.stringify(sources) };
}
export function readLegalSources(protocol: unknown): LegalSource[] {
  if (!Array.isArray(protocol)) return [];
  const metadata = protocol.find(item => item?.role === "system" && typeof item.content === "string" && item.content.startsWith(LEGAL_METADATA_MARKER));
  if (!metadata) return [];
  try {
    const parsed = z.array(legalSourceSchema).max(5).safeParse(JSON.parse(metadata.content.slice(LEGAL_METADATA_MARKER.length)));
    return parsed.success && new Set(parsed.data.map(s => s.id)).size === parsed.data.length ? parsed.data : [];
  } catch { return []; }
}
