export const publicServiceCategoriesEn = {
  "legal-consultation": "Consultations by Area",
  "corporate-business-services": "Companies & Commercial Contracts",
  "real-estate-legal-support": "Real Estate Legal Review",
  "claims-collections": "Debt Claims & Settlement"
} as const;

export const publicServiceCategoriesAr = {
  "legal-consultation": "استشارات حسب المجال",
  "corporate-business-services": "الشركات والعقود التجارية",
  "real-estate-legal-support": "مراجعة قانونية عقارية",
  "claims-collections": "المطالبات المالية والتسويات"
} as const;

export const publicLegalServicesEn = [
  {
    "areaKey": "legal-consultation",
    "title": "Legal Consultations",
    "slug": "legal-consultation",
    "category": "legal-consultation",
    "icon": "support_agent",
    "description": "Criminal, civil, commercial, family, and labor consultation requests organized for office review.",
    "content": "KMT Legal helps visitors present the facts, contact details, and core question behind a consultation request so the office can review the matter and decide the suitable next step without turning the website into final legal advice.",
    "subServices": [
      "Criminal law request",
      "Civil law request",
      "Commercial matter request",
      "Family matter request",
      "Labor matter request"
    ],
    "audience": [
      "Individuals seeking advice on a legal matter",
      "Business owners reviewing their options"
    ],
    "steps": [
      "Describe the matter and your main questions",
      "Arrange the appropriate consultation after office review",
      "Discuss the available options and agreed follow-up"
    ],
    "requiredDocuments": [
      "Short facts summary",
      "Relevant dates and parties",
      "Any document list requested later by the team"
    ],
    "outcomes": [
      "Clear intake summary",
      "Office review by the team",
      "Next-step communication or appointment confirmation"
    ]
  },
  {
    "areaKey": "company-formation",
    "title": "Company Formation",
    "slug": "company-formation",
    "category": "corporate-business-services",
    "icon": "account_balance",
    "description": "Legal support for founders and investors preparing to establish a company in Egypt.",
    "content": "We review the proposed activity, ownership structure and founders’ requirements to identify the appropriate formation steps and documents. The scope and timetable are agreed after reviewing the information and any applicable approvals.",
    "subServices": [
      "Review of the proposed legal structure",
      "Founders’ agreements and formation documents",
      "Registration requirements",
      "Post-formation legal obligations"
    ],
    "audience": [
      "Founders establishing a new business",
      "Investors and business partners",
      "Businesses preparing an Egyptian entity"
    ],
    "steps": [
      "Share the proposed activity and founders’ details",
      "Review the legal structure and required documents with the team",
      "Agree the scope, fees and next steps before work begins"
    ],
    "requiredDocuments": [
      "Founders’ identification details",
      "Proposed business activity and company name",
      "Ownership, capital and address information when available"
    ],
    "outcomes": [
      "A formation document checklist",
      "A defined scope of legal assistance",
      "Follow-up on agreed registration steps"
    ]
  },
  {
    "areaKey": "corporate-business-services",
    "title": "Business Services",
    "slug": "corporate-business-services",
    "category": "corporate-business-services",
    "icon": "account_balance",
    "description": "Legal support for company governance, day-to-day commercial matters and business disputes.",
    "content": "Business requests are organized around entity needs, contracts, governance obligations, and commercial risks so the team can review the file and assign the right lawyer or business advisory path.",
    "subServices": [
      "Corporate Decisions and Partner Relations",
      "Operational Legal Review",
      "Corporate Governance & Compliance",
      "Business Dispute Advisory"
    ],
    "audience": [
      "Established companies and family businesses",
      "Managers, partners and commercial teams"
    ],
    "steps": [
      "Describe the business need and relevant deadlines",
      "Review the available records and legal priorities",
      "Agree the work scope and follow-up arrangements"
    ],
    "requiredDocuments": [
      "Company or party details",
      "Draft contracts or correspondence",
      "Commercial register or formation documents when available"
    ],
    "outcomes": [
      "Organized business request",
      "Document and issue checklist",
      "Lawyer assignment after office review"
    ]
  },
  {
    "areaKey": "contracts",
    "title": "Contract Drafting & Review",
    "slug": "contracts",
    "category": "corporate-business-services",
    "icon": "description",
    "description": "Drafting and review of commercial agreements with attention to obligations, liability and termination.",
    "content": "We review the purpose of the agreement, the parties’ obligations and the practical risks before proposing wording or amendments. The work may include preparing a draft, reviewing an existing contract or supporting negotiations within an agreed scope.",
    "subServices": [
      "Contract drafting",
      "Review of existing agreements",
      "Negotiation support",
      "Amendments and termination provisions"
    ],
    "audience": [
      "Companies and business owners",
      "Contracting parties preparing to sign or amend an agreement"
    ],
    "steps": [
      "Share the purpose of the agreement and any existing draft",
      "Review the obligations and points requiring clarification",
      "Discuss the proposed draft or amendments with the team"
    ],
    "requiredDocuments": [
      "Existing draft, if any",
      "Party details and commercial terms",
      "Relevant correspondence and deadlines"
    ],
    "outcomes": [
      "A draft or review within the agreed scope",
      "A summary of issues requiring a decision",
      "Proposed wording for discussion"
    ]
  },
  {
    "areaKey": "real-estate-legal-support",
    "title": "Real Estate Legal Review",
    "slug": "real-estate-legal-support",
    "category": "real-estate-legal-support",
    "icon": "real_estate_agent",
    "description": "Sale and purchase contracts, property document review, lease agreements, and real estate dispute support.",
    "content": "Real estate support focuses on preparing ownership, sale, purchase, lease, and dispute facts for review before the client takes a signing, negotiation, or follow-up step.",
    "subServices": [
      "Sale & Purchase Contracts",
      "Property Due Diligence",
      "Lease Agreements",
      "Real Estate Dispute Advisory"
    ],
    "audience": [
      "Buyers, sellers and property owners",
      "Landlords, tenants and developers"
    ],
    "steps": [
      "Describe the transaction or dispute",
      "Arrange review of the available property documents",
      "Agree the necessary legal review and next steps"
    ],
    "requiredDocuments": [
      "Ownership or lease documents",
      "Sale, purchase, or lease draft",
      "Receipts, correspondence, or prior transaction details"
    ],
    "outcomes": [
      "Property document checklist",
      "Initial review path",
      "Clear questions for lawyer follow-up"
    ]
  },
  {
    "areaKey": "claims-collections",
    "title": "Debt Collection & Settlements",
    "slug": "claims-collections",
    "category": "claims-collections",
    "icon": "payments",
    "description": "Debt claims, legal notices, cheques, promissory notes, settlement negotiation, and follow-up.",
    "content": "Debt claims and settlement requests are arranged around the debt source, supporting documents, notices, cheques, promissory notes, and settlement options before the office decides the appropriate next step.",
    "subServices": [
      "Debt Collection",
      "Legal Notices",
      "Cheques & Promissory Notes",
      "Settlement Negotiation"
    ],
    "audience": [
      "Companies with unpaid commercial debts",
      "Individuals with documented financial claims"
    ],
    "steps": [
      "Provide a summary of the debt and payment history",
      "Review the supporting documents and previous demands",
      "Agree the appropriate negotiation or legal follow-up"
    ],
    "requiredDocuments": [
      "Invoices, cheques, promissory notes, or debt documents",
      "Correspondence and notices",
      "Payment history or settlement attempts"
    ],
    "outcomes": [
      "Claim summary",
      "Supporting-document list",
      "Follow-up path for review and assignment"
    ]
  }
] as const;

export const publicLegalServicesAr = [
  {
    "areaKey": "legal-consultation",
    "title": "الاستشارات القانونية",
    "slug": "legal-consultation",
    "category": "legal-consultation",
    "icon": "support_agent",
    "description": "طلبات استشارة جنائية ومدنية وتجارية وأسرية وعمالية يتم تنظيمها لمراجعة المكتب.",
    "content": "يساعد KMT Legal الزائر على ترتيب الوقائع وبيانات التواصل والسؤال الأساسي حتى يراجع المكتب الطلب ويحدد الخطوة المناسبة، بدون تقديم رأي قانوني نهائي من الموقع.",
    "subServices": [
      "استشارات جنائية",
      "استشارات مدنية",
      "استشارات تجارية",
      "استشارات أسرية",
      "استشارات عمالية"
    ],
    "audience": [
      "الأفراد الراغبون في مناقشة مسألة قانونية",
      "أصحاب الأعمال الراغبون في تقييم الخيارات المتاحة"
    ],
    "steps": [
      "توضيح المسألة والأسئلة الأساسية",
      "ترتيب الاستشارة المناسبة بعد مراجعة المكتب",
      "مناقشة الخيارات والخطوات المتفق عليها للمتابعة"
    ],
    "requiredDocuments": [
      "ملخص قصير للوقائع",
      "التواريخ والأطراف المهمة",
      "قائمة بالمستندات المتاحة، مع تقديمها عند طلب الفريق"
    ],
    "outcomes": [
      "ملخص استقبال واضح",
      "مراجعة من فريق المكتب",
      "تواصل أو تأكيد موعد بعد المراجعة"
    ]
  },
  {
    "areaKey": "company-formation",
    "title": "تأسيس الشركات",
    "slug": "company-formation",
    "category": "corporate-business-services",
    "icon": "account_balance",
    "description": "دعم قانوني للمؤسسين والمستثمرين في إجراءات تأسيس الشركات في مصر.",
    "content": "نراجع النشاط المقترح وهيكل الملكية واحتياجات المؤسسين لتحديد خطوات التأسيس والمستندات المناسبة. يُتفق على نطاق العمل والمدة بعد مراجعة البيانات والموافقات اللازمة بحسب الحالة.",
    "subServices": [
      "مراجعة الشكل القانوني المقترح",
      "اتفاقات المؤسسين ومستندات التأسيس",
      "متطلبات التسجيل",
      "الالتزامات القانونية بعد التأسيس"
    ],
    "audience": [
      "مؤسسو المشروعات الجديدة",
      "المستثمرون والشركاء",
      "الشركات الراغبة في تأسيس كيان في مصر"
    ],
    "steps": [
      "إرسال وصف النشاط وبيانات المؤسسين",
      "مراجعة الشكل القانوني والمستندات المطلوبة مع الفريق",
      "الاتفاق على نطاق العمل والأتعاب والخطوات التالية قبل البدء"
    ],
    "requiredDocuments": [
      "بيانات هوية المؤسسين",
      "النشاط المقترح واسم الشركة",
      "بيانات الملكية ورأس المال والعنوان عند توفرها"
    ],
    "outcomes": [
      "قائمة بمستندات التأسيس",
      "تحديد نطاق المساعدة القانونية",
      "متابعة إجراءات التسجيل المتفق عليها"
    ]
  },
  {
    "areaKey": "corporate-business-services",
    "title": "خدمات الأعمال",
    "slug": "corporate-business-services",
    "category": "corporate-business-services",
    "icon": "account_balance",
    "description": "دعم قانوني لحوكمة الشركات والمعاملات التجارية اليومية والمنازعات المتعلقة بالأعمال.",
    "content": "نراجع احتياجات الشركة وعقودها ومتطلبات الحوكمة والمخاطر التجارية لتحديد المحامي المناسب والخطوات التالية.",
    "subServices": [
      "قرارات الشركات وعلاقات الشركاء",
      "المراجعة القانونية للتشغيل",
      "الحوكمة والامتثال",
      "الاستشارات المتعلقة بالمنازعات التجارية"
    ],
    "audience": [
      "الشركات القائمة والشركات العائلية",
      "المديرون والشركاء والفرق التجارية"
    ],
    "steps": [
      "توضيح احتياجات العمل والمواعيد المرتبطة بها",
      "مراجعة المستندات والأولويات القانونية",
      "الاتفاق على نطاق العمل وآلية المتابعة"
    ],
    "requiredDocuments": [
      "بيانات الشركة أو الأطراف",
      "مسودات العقود أو المراسلات",
      "السجل التجاري أو مستندات التأسيس عند توفرها"
    ],
    "outcomes": [
      "مراجعة احتياجات الشركة",
      "قائمة بالمستندات والنقاط المطلوبة",
      "تعيين محامٍ بعد مراجعة المكتب"
    ]
  },
  {
    "areaKey": "contracts",
    "title": "صياغة العقود ومراجعتها",
    "slug": "contracts",
    "category": "corporate-business-services",
    "icon": "description",
    "description": "صياغة الاتفاقات التجارية ومراجعتها مع توضيح الالتزامات والمسؤولية وشروط الإنهاء.",
    "content": "نراجع الغرض من الاتفاق والتزامات الأطراف والمخاطر العملية قبل اقتراح الصياغة أو التعديلات. قد يشمل العمل إعداد مسودة جديدة أو مراجعة عقد قائم أو المساندة في التفاوض وفق نطاق متفق عليه.",
    "subServices": [
      "صياغة العقود",
      "مراجعة الاتفاقات القائمة",
      "المساندة في التفاوض",
      "ملاحق العقود وشروط الإنهاء"
    ],
    "audience": [
      "الشركات وأصحاب الأعمال",
      "أطراف الاتفاقات قبل التوقيع أو التعديل"
    ],
    "steps": [
      "توضيح الغرض من الاتفاق وإرسال المسودة المتاحة",
      "مراجعة الالتزامات والنقاط التي تحتاج إلى توضيح",
      "مناقشة الصياغة أو التعديلات المقترحة مع الفريق"
    ],
    "requiredDocuments": [
      "المسودة الحالية إن وجدت",
      "بيانات الأطراف والشروط التجارية",
      "المراسلات والمواعيد ذات الصلة"
    ],
    "outcomes": [
      "مسودة أو مراجعة وفق نطاق العمل",
      "ملخص بالنقاط التي تحتاج إلى قرار",
      "صياغات مقترحة للمناقشة"
    ]
  },
  {
    "areaKey": "real-estate-legal-support",
    "title": "الخدمات القانونية العقارية",
    "slug": "real-estate-legal-support",
    "category": "real-estate-legal-support",
    "icon": "real_estate_agent",
    "description": "عقود البيع والشراء ومراجعة مستندات الملكية وعقود الإيجار والمنازعات العقارية.",
    "content": "يركز الدعم العقاري على تجهيز مستندات الملكية والبيع والشراء والإيجار ووقائع النزاع للمراجعة قبل التوقيع أو التفاوض أو المتابعة.",
    "subServices": [
      "عقود البيع والشراء",
      "الفحص القانوني للعقارات",
      "عقود الإيجار",
      "الاستشارات العقارية"
    ],
    "audience": [
      "المشترون والبائعون وملاك العقارات",
      "المؤجرون والمستأجرون والمطورون"
    ],
    "steps": [
      "توضيح التصرف العقاري أو النزاع",
      "ترتيب مراجعة مستندات العقار المتاحة",
      "الاتفاق على نطاق المراجعة والخطوات التالية"
    ],
    "requiredDocuments": [
      "مستندات الملكية أو الإيجار",
      "مسودة البيع أو الشراء أو الإيجار",
      "الإيصالات أو المراسلات أو بيانات التصرفات السابقة"
    ],
    "outcomes": [
      "قائمة فحص للمستندات العقارية",
      "مراجعة أولية للمستندات",
      "تحديد النقاط التي تحتاج إلى متابعة المحامي"
    ]
  },
  {
    "areaKey": "claims-collections",
    "title": "تحصيل الديون والتسويات",
    "slug": "claims-collections",
    "category": "claims-collections",
    "icon": "payments",
    "description": "المطالبات المالية والإنذارات القانونية والشيكات والإيصالات والتفاوض على التسويات.",
    "content": "يراجع المكتب مصدر الدين والمستندات المؤيدة له والإنذارات والشيكات والإيصالات ومحاولات التسوية لتحديد الخطوة المناسبة.",
    "subServices": [
      "المطالبات المالية",
      "الإنذارات القانونية",
      "الشيكات والإيصالات",
      "التفاوض والتسويات"
    ],
    "audience": [
      "الشركات التي لديها مستحقات تجارية غير مسددة",
      "الأفراد أصحاب المطالبات المالية المؤيدة بمستندات"
    ],
    "steps": [
      "تقديم ملخص بالدين وسجل السداد",
      "مراجعة المستندات والمطالبات السابقة",
      "الاتفاق على خطوات التفاوض أو المتابعة القانونية المناسبة"
    ],
    "requiredDocuments": [
      "الفواتير أو الشيكات أو الإيصالات أو مستندات الدين",
      "المراسلات والإنذارات",
      "سجل السداد أو محاولات التسوية"
    ],
    "outcomes": [
      "ملخص مطالبة",
      "قائمة مستندات داعمة",
      "تحديد خطوات المتابعة والمحامي المناسب"
    ]
  }
] as const;

export const serviceSlugAliases = {
  "corporate-law": "corporate-business-services",
  "contract-drafting": "contracts",
  "foreign-investment": "corporate-business-services",
  "tax-advisory": "corporate-business-services",
  "commercial-contracts": "contracts",
  "commercial-disputes": "corporate-business-services",
  "arbitration": "legal-consultation",
  "litigation": "legal-consultation",
  "criminal-defense": "legal-consultation",
  "employment-compliance": "legal-consultation",
  "labor-law": "legal-consultation",
  "real-estate-consultation": "real-estate-legal-support",
  "debt-recovery": "claims-collections",
  "commercial-collection": "claims-collections",
  "collections": "claims-collections"
} as const;

export function resolvePublicServiceSlug(slug: string) {
  return serviceSlugAliases[slug as keyof typeof serviceSlugAliases] ?? slug;
}
