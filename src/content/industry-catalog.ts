import type { PublicLocale } from '@/lib/public-locale';

/** Website content source p44. Stable IDs are independent of presentation order. */
const industries = [
  {id:'real-estate', ar:'العقارات', en:'Real Estate', summaryAr:'الملكية والإيجارات والتطوير والاتفاقات العقارية.', summaryEn:'Ownership, leasing, development and property agreements.', services:['real-estate-legal-support','contracts']},
  {id:'construction', ar:'التشييد والبنية التحتية', en:'Construction & Infrastructure', summaryAr:'عقود المقاولات والمشروعات والتراخيص وتسوية المنازعات.', summaryEn:'Construction contracts, projects, licensing and dispute resolution.', services:['real-estate-legal-support','arbitration','administrative-law']},
  {id:'financial-services', ar:'الخدمات المالية', en:'Financial Services', summaryAr:'التمويل والضمانات والحوكمة والمنازعات المالية.', summaryEn:'Finance, security, governance and financial disputes.', services:['banking-finance','corporate-business-services','tax-customs']},
  {id:'technology', ar:'التكنولوجيا والإعلام والاتصالات', en:'Technology, Media & Telecoms', summaryAr:'العقود التقنية والحقوق الفكرية وحماية البيانات.', summaryEn:'Technology agreements, intellectual property and data protection.', services:['ip-technology','contracts','corporate-business-services']},
  {id:'retail', ar:'التجزئة', en:'Retail', summaryAr:'العقود التجارية والإيجارات والعمل وتحصيل المستحقات.', summaryEn:'Commercial agreements, leases, employment and receivables.', services:['contracts','employment','claims-collections']},
  {id:'hospitality', ar:'الضيافة', en:'Hospitality', summaryAr:'اتفاقات التشغيل والتراخيص والعلاقات العمالية.', summaryEn:'Operating agreements, licences and employment relationships.', services:['investment','employment','real-estate-legal-support']},
  {id:'manufacturing', ar:'التصنيع', en:'Manufacturing', summaryAr:'تأسيس المشروعات والتوريد والتراخيص والجمارك.', summaryEn:'Project establishment, supply, licensing and customs.', services:['investment','contracts','tax-customs']},
  {id:'energy', ar:'الطاقة والمرافق', en:'Energy & Utilities', summaryAr:'المشروعات والاتفاقات والاشتراطات القطاعية والبيئية.', summaryEn:'Projects, agreements and sectoral and environmental requirements.', services:['specialist-practices','investment','administrative-law']},
  {id:'healthcare', ar:'الرعاية الصحية', en:'Healthcare', summaryAr:'التراخيص والعقود والمسؤولية المهنية والالتزامات القطاعية.', summaryEn:'Licensing, contracts, professional liability and sector requirements.', services:['specialist-practices','compensation-insurance','employment']},
  {id:'transport', ar:'النقل والخدمات اللوجستية', en:'Transport & Logistics', summaryAr:'الشحن والنقل والتخليص والتأمين والمطالبات.', summaryEn:'Freight, carriage, clearance, insurance and claims.', services:['transport','tax-customs','compensation-insurance']},
] as const;

export function industryCatalog(locale: PublicLocale) {
  return industries.map(item => ({id:item.id,title:locale==='ar'?item.ar:item.en,summary:locale==='ar'?item.summaryAr:item.summaryEn,services:item.services}));
}
