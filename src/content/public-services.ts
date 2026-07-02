export const publicServiceCategoriesEn = {
  "legal-consultation": "Legal Consultation",
  "corporate-business-services": "Corporate & Business Services",
  "real-estate-legal-support": "Real Estate Legal Support",
  "claims-collections": "Claims & Collections"
} as const;

export const publicServiceCategoriesAr = {
  "legal-consultation": "الاستشارات القانونية",
  "corporate-business-services": "خدمات الشركات والأعمال",
  "real-estate-legal-support": "الدعم القانوني العقاري",
  "claims-collections": "التحصيل والتسويات"
} as const;

export const publicLegalServicesEn = [
  {
    areaKey: "legal-consultation",
    title: "Legal Consultation",
    slug: "legal-consultation",
    category: "legal-consultation",
    icon: "support_agent",
    description: "Focused criminal, civil, commercial, family, and labor consultation requests prepared for human lawyer review.",
    content:
      "KMT Legal helps visitors organize the facts, contact details, and core question behind a consultation request so the office can review it and direct it to the right lawyer without turning the website into final legal advice.",
    subServices: [
      "Criminal Legal Consultation",
      "Civil Legal Consultation",
      "Commercial Legal Consultation",
      "Family Legal Consultation",
      "Labor Legal Consultation"
    ],
    requiredDocuments: ["Short facts summary", "Relevant dates and parties", "Any document list requested later by the team"],
    outcomes: ["Clear intake summary", "Human review by the office team", "Next-step communication or appointment confirmation"]
  },
  {
    areaKey: "corporate-business-services",
    title: "Corporate & Business Services",
    slug: "corporate-business-services",
    category: "corporate-business-services",
    icon: "account_balance",
    description: "Company formation, contract drafting, contract review, governance, compliance, and business dispute advisory.",
    content:
      "Business requests are organized around entity needs, contracts, governance obligations, and commercial risks so the team can review the file and assign the right lawyer or business advisory path.",
    subServices: [
      "Company Formation",
      "Contract Drafting",
      "Contract Review",
      "Corporate Governance & Compliance",
      "Business Dispute Advisory"
    ],
    requiredDocuments: ["Company or party details", "Draft contracts or correspondence", "Commercial register or formation documents when available"],
    outcomes: ["Organized business request", "Document and issue checklist", "Lawyer assignment after office review"]
  },
  {
    areaKey: "real-estate-legal-support",
    title: "Real Estate Legal Support",
    slug: "real-estate-legal-support",
    category: "real-estate-legal-support",
    icon: "real_estate_agent",
    description: "Sale and purchase contracts, property due diligence, lease agreements, and real estate dispute advisory.",
    content:
      "Real estate support focuses on preparing ownership, sale, purchase, lease, and dispute facts for review before the client takes a signing, negotiation, or follow-up step.",
    subServices: [
      "Sale & Purchase Contracts",
      "Property Due Diligence",
      "Lease Agreements",
      "Real Estate Dispute Advisory"
    ],
    requiredDocuments: ["Ownership or lease documents", "Sale, purchase, or lease draft", "Receipts, correspondence, or prior transaction details"],
    outcomes: ["Property document checklist", "Initial review path", "Clear questions for lawyer follow-up"]
  },
  {
    areaKey: "claims-collections",
    title: "Claims & Collections",
    slug: "claims-collections",
    category: "claims-collections",
    icon: "payments",
    description: "Debt collection, legal notices, cheques and promissory notes, settlement negotiation, and collection follow-up.",
    content:
      "Claims and collection requests are arranged around the debt source, supporting documents, notices, cheques, promissory notes, and settlement options before the office decides the appropriate next step.",
    subServices: ["Debt Collection", "Legal Notices", "Cheques & Promissory Notes", "Settlement Negotiation"],
    requiredDocuments: ["Invoices, cheques, promissory notes, or debt documents", "Correspondence and notices", "Payment history or settlement attempts"],
    outcomes: ["Claim summary", "Supporting-document list", "Follow-up path for review and assignment"]
  }
] as const;

export const publicLegalServicesAr = [
  {
    areaKey: "legal-consultation",
    title: "الاستشارات القانونية",
    slug: "legal-consultation",
    category: "legal-consultation",
    icon: "support_agent",
    description: "طلبات استشارة جنائية ومدنية وتجارية وأسرية وعمالية يتم تنظيمها لمراجعة محامٍ من الفريق.",
    content:
      "يساعد KMT Legal الزائر على ترتيب الوقائع وبيانات التواصل والسؤال الأساسي حتى يراجع المكتب الطلب ويوجهه للمحامي المناسب، بدون تقديم رأي قانوني نهائي من الموقع.",
    subServices: ["استشارات جنائية", "استشارات مدنية", "استشارات تجارية", "استشارات أسرية", "استشارات عمالية"],
    requiredDocuments: ["ملخص قصير للوقائع", "التواريخ والأطراف المهمة", "أي قائمة مستندات يطلبها الفريق لاحقًا"],
    outcomes: ["ملخص استقبال واضح", "مراجعة بشرية من فريق المكتب", "تواصل أو تأكيد موعد بعد المراجعة"]
  },
  {
    areaKey: "corporate-business-services",
    title: "خدمات الشركات والأعمال",
    slug: "corporate-business-services",
    category: "corporate-business-services",
    icon: "account_balance",
    description: "تأسيس الشركات وصياغة العقود ومراجعتها والحوكمة والامتثال والاستشارات المتعلقة بالمنازعات التجارية.",
    content:
      "يتم تنظيم طلبات الأعمال حول احتياجات الشركة والعقود والحوكمة والمخاطر التجارية حتى يراجع الفريق الملف ويعين المحامي أو مسار المتابعة المناسب.",
    subServices: ["تأسيس الشركات", "صياغة العقود", "مراجعة العقود", "الحوكمة والامتثال", "الاستشارات المتعلقة بالمنازعات التجارية"],
    requiredDocuments: ["بيانات الشركة أو الأطراف", "مسودات العقود أو المراسلات", "السجل التجاري أو مستندات التأسيس عند توفرها"],
    outcomes: ["تنظيم طلب الأعمال", "قائمة بالمستندات والنقاط المطلوبة", "تعيين محامٍ بعد مراجعة المكتب"]
  },
  {
    areaKey: "real-estate-legal-support",
    title: "الدعم القانوني العقاري",
    slug: "real-estate-legal-support",
    category: "real-estate-legal-support",
    icon: "real_estate_agent",
    description: "عقود البيع والشراء والفحص القانوني للعقارات وعقود الإيجار والاستشارات العقارية.",
    content:
      "يركز الدعم العقاري على تجهيز مستندات الملكية والبيع والشراء والإيجار ووقائع النزاع للمراجعة قبل التوقيع أو التفاوض أو المتابعة.",
    subServices: ["عقود البيع والشراء", "الفحص القانوني للعقارات", "عقود الإيجار", "الاستشارات العقارية"],
    requiredDocuments: ["مستندات الملكية أو الإيجار", "مسودة البيع أو الشراء أو الإيجار", "الإيصالات أو المراسلات أو بيانات التصرفات السابقة"],
    outcomes: ["قائمة فحص للمستندات العقارية", "مسار مراجعة أولي", "أسئلة واضحة لمتابعة المحامي"]
  },
  {
    areaKey: "claims-collections",
    title: "التحصيل والتسويات",
    slug: "claims-collections",
    category: "claims-collections",
    icon: "payments",
    description: "تحصيل المديونيات والإنذارات القانونية والشيكات والإيصالات والتفاوض والتسويات.",
    content:
      "يتم ترتيب طلبات التحصيل حول مصدر الدين والمستندات المؤيدة والإنذارات والشيكات والإيصالات ومحاولات التسوية قبل تحديد الخطوة المناسبة من المكتب.",
    subServices: ["تحصيل المديونيات", "الإنذارات القانونية", "الشيكات والإيصالات", "التفاوض والتسويات"],
    requiredDocuments: ["الفواتير أو الشيكات أو الإيصالات أو مستندات الدين", "المراسلات والإنذارات", "سجل السداد أو محاولات التسوية"],
    outcomes: ["ملخص مطالبة", "قائمة مستندات داعمة", "مسار متابعة للمراجعة والتعيين"]
  }
] as const;

export const serviceSlugAliases = {
  "corporate-law": "corporate-business-services",
  "contract-drafting": "corporate-business-services",
  "foreign-investment": "corporate-business-services",
  "tax-advisory": "corporate-business-services",
  "commercial-contracts": "corporate-business-services",
  "commercial-disputes": "corporate-business-services",
  arbitration: "legal-consultation",
  litigation: "legal-consultation",
  "criminal-defense": "legal-consultation",
  "employment-compliance": "legal-consultation",
  "labor-law": "legal-consultation",
  "real-estate-consultation": "real-estate-legal-support",
  "debt-recovery": "claims-collections",
  "commercial-collection": "claims-collections",
  collections: "claims-collections"
} as const;

export function resolvePublicServiceSlug(slug: string) {
  return serviceSlugAliases[slug as keyof typeof serviceSlugAliases] ?? slug;
}
