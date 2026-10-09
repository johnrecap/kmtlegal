/** Phase-two public copy; official firm statements and team facts await owner approval. */
export const firmStatementsApproved = false;
export const publicExpansion = {
  ar: {
    audience: "لمن نقدم هذه الخدمة؟", steps: "خطوات التعامل مع المكتب", whatsapp: "تواصل عبر واتساب",
    unavailableTitle: "تعذّر تحميل المقالات الآن", unavailableDescription: "يرجى إعادة المحاولة لاحقًا. يمكنك متابعة تصفح خدمات المكتب أو التواصل معنا.", retry: "إعادة المحاولة",
    firm: "عن المكتب", industries: "القطاعات", insights: "رؤى قانونية", contact: "تواصل معنا",
    firmDescription: "تعرّف إلى KMT Legal ومنهج المكتب في تقديم الدعم القانوني للشركات والمستثمرين والأفراد من العاصمة الإدارية الجديدة.",
    firmIntro: "حيث يلتقي القانون بالأعمال",
    firmBody: "يجمع عمل المكتب بين فهم احتياجات العميل ومراجعة الوقائع والمستندات. نساعدك على تحديد المسألة القانونية وترتيب أولوياتها قبل الاتفاق على نطاق العمل والخطوات التالية.",
    visionTitle: "رؤيتنا", vision: "أن تكون المساندة القانونية جزءًا واضحًا من قرارات الأعمال، يساعد على فهم الالتزامات وتقييم الخيارات بعناية.",
    missionTitle: "رسالتنا", mission: "تقديم دعم قانوني يقوم على فهم احتياجات العميل، ووضوح نطاق العمل، وسرية المعلومات، والتواصل بشأن الخطوات المتفق عليها.",
    approachTitle: "كيف نعمل معك؟", approach: ["نفهم احتياجاتك والوقائع الأساسية", "نراجع المستندات ونحدد المسائل القانونية", "نتفق على نطاق العمل والأتعاب", "نتابع الخطوات ونتواصل بشأن المستجدات"],
    teamLink: "تعرّف إلى فريق العمل", servicesLink: "استعرض خدماتنا", firmLink: "تعرّف إلى المكتب", industriesLink: "استعرض القطاعات", insightsLink: "استعرض الرؤى القانونية",
    industriesDescription: "دعم قانوني يراعي طبيعة النشاط واحتياجات الشركات والمستثمرين وأصحاب الأعمال، مع روابط مباشرة إلى الخدمات المناسبة.",
    industryServices: "الخدمات ذات الصلة", overviewTitle: "تعرّف إلينا واختر ما يناسب احتياجاتك",
    overviewDescription: "اقرأ عن منهج المكتب والقطاعات التي يخدمها، واطّلع على المقالات المنشورة من فريقه.",
    teamExpertise: "الخبرات المهنية", teamBackground: "المؤهلات والعضويات", teamLanguages: "لغات التواصل",
    insightCategories: { contracts: "العقود", intake: "الاستشارات", "real-estate": "العقارات", corporate: "الشركات", general: "تحديثات قانونية" },
  },
  en: {
    audience: "Who this service is for", steps: "Working with the office", whatsapp: "Contact us on WhatsApp",
    unavailableTitle: "Articles are temporarily unavailable", unavailableDescription: "Please try again later. You can continue exploring our services or contact the office.", retry: "Try again",
    firm: "Our Firm", industries: "Industries", insights: "Insights", contact: "Contact Us",
    firmDescription: "Meet KMT Legal and learn how the office supports companies, investors and individuals from Egypt’s New Administrative Capital.",
    firmIntro: "Where law meets business",
    firmBody: "Our work starts with understanding the client’s needs and reviewing the facts and documents. We help identify the legal questions and priorities before agreeing the scope of work and next steps.",
    visionTitle: "Our vision", vision: "For legal support to be a clear part of business decisions, helping people understand their obligations and assess their options carefully.",
    missionTitle: "Our mission", mission: "To provide legal support grounded in the client’s needs, a clear scope of work, confidentiality and communication about the agreed next steps.",
    approachTitle: "How we work with you", approach: ["Understand your needs and the key facts", "Review documents and identify the legal questions", "Agree the scope of work and fees", "Follow up on the agreed steps and communicate developments"],
    teamLink: "Meet the team", servicesLink: "Explore our services", firmLink: "Meet our firm", industriesLink: "Explore industries", insightsLink: "Explore legal insights",
    industriesDescription: "Legal support shaped around the needs of companies, investors and business owners, with direct access to relevant services.",
    industryServices: "Related services", overviewTitle: "Get to know us and find the support you need",
    overviewDescription: "Explore the office’s approach, the sectors it serves and the articles published by its team.",
    teamExpertise: "Professional experience", teamBackground: "Qualifications & memberships", teamLanguages: "Languages",
    insightCategories: { contracts: "Contracts", intake: "Consultations", "real-estate": "Real Estate", corporate: "Companies", general: "Legal Updates" },
  }
} as const;

export const industryServiceSlugs = [
  ["corporate-business-services", "contracts"],
  ["real-estate-legal-support", "contracts"],
  ["contracts", "claims-collections"],
  ["company-formation", "corporate-business-services", "contracts"],
  ["company-formation", "corporate-business-services"],
  ["legal-consultation", "real-estate-legal-support", "claims-collections"]
] as const;

export function publicArticleCategory(category: string, locale: "ar" | "en") {
  const labels = publicExpansion[locale].insightCategories;
  return labels[category as keyof typeof labels] ?? category;
}
