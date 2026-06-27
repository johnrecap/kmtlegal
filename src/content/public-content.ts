export const publicNavItems = [
  { label: "الرئيسية", href: "/" },
  { label: "مجالات الخبرة", href: "/services" },
  { label: "الفريق", href: "/team" },
  { label: "المقالات", href: "/articles" },
  { label: "دراسات الحالة", href: "/case-studies" },
  { label: "الإعلام", href: "/media" },
  { label: "تواصل", href: "/contact" }
];

export const serviceCategories: Record<string, string> = {
  corporate: "الشركات والمعاملات",
  disputes: "التقاضي والمنازعات",
  "real-estate": "العقارات",
  employment: "العمل والامتثال"
};

export const legalServices = [
  {
    areaKey: "corporate",
    title: "قانون الشركات",
    slug: "corporate-law",
    category: "corporate",
    icon: "account_balance",
    description: "دعم قانوني للشركات في التأسيس والحوكمة وإعادة الهيكلة والمعاملات اليومية.",
    content:
      "نساعد الشركات على تنظيم المستندات والقرارات والعلاقات التعاقدية بصورة واضحة، مع مراجعة المخاطر قبل اتخاذ قرارات إدارية أو تجارية مؤثرة.",
    requiredDocuments: ["السجل التجاري أو مسودة التأسيس", "قرارات الشركاء أو مجلس الإدارة", "العقود أو المراسلات ذات الصلة"],
    outcomes: ["ملخص قانوني منظم", "قائمة نقاط تحتاج مراجعة أو قرار", "خطة مستندات وإجراءات مقترحة"]
  },
  {
    areaKey: "litigation",
    title: "التقاضي",
    slug: "commercial-disputes",
    category: "disputes",
    icon: "gavel",
    description: "تنظيم ملفات المنازعات التجارية والمدنية ومراجعة المستندات قبل التفاوض أو التصعيد.",
    content:
      "نرتب الوقائع والمراسلات والمستندات ونحدد نقاط القوة والقصور، ثم نقترح مسار مراجعة عملي يساعد العميل على فهم الخيارات دون وعود بنتيجة.",
    requiredDocuments: ["العقد أو مصدر الالتزام", "المراسلات والإنذارات", "الفواتير أو المستندات المؤيدة"],
    outcomes: ["ملخص وقائع", "قائمة مستندات ناقصة", "تصور أولي لمسارات المراجعة"]
  },
  {
    areaKey: "arbitration",
    title: "التحكيم",
    slug: "arbitration",
    category: "disputes",
    icon: "balance",
    description: "مراجعة شروط التحكيم وتنظيم ملف النزاع المحلي أو الدولي قبل بدء الإجراءات.",
    content:
      "نراجع شرط التحكيم ونطاقه والمراسلات السابقة والوقائع الأساسية، ثم نجهز الملف للمراجعة القانونية المتخصصة بما يحافظ على ترتيب المستندات والحجج.",
    requiredDocuments: ["العقد المتضمن شرط التحكيم", "إشعارات النزاع", "المراسلات والمستندات المؤيدة"],
    outcomes: ["قراءة أولية لشرط التحكيم", "قائمة نقاط اختصاص وإجراءات", "تنظيم ملف المستندات"]
  },
  {
    areaKey: "real-estate",
    title: "العقارات",
    slug: "real-estate-consultation",
    category: "real-estate",
    icon: "real_estate_agent",
    description: "مراجعة موقف الملكية والتصرفات العقارية ومخاطر البيع أو الإيجار أو المشاركة.",
    content:
      "نساعد العملاء على فهم المستندات العقارية ومخاطر التسجيل والتصرفات السابقة والالتزامات الظاهرة قبل اتخاذ قرار قانوني أو تجاري.",
    requiredDocuments: ["مستند الملكية", "بطاقة الهوية أو بيانات الشركة", "العقود أو الإيصالات ذات الصلة"],
    outcomes: ["تقييم أولي للمستندات", "نقاط استفسار قبل التعاقد", "خطة مستندات مطلوبة"]
  },
  {
    areaKey: "tax-advisory",
    title: "الاستشارات الضريبية",
    slug: "tax-advisory",
    category: "corporate",
    icon: "receipt_long",
    description: "مراجعة قانونية أولية للمخاطر الضريبية والتعاقدية المرتبطة بالأنشطة والمعاملات.",
    content:
      "نساعد العملاء على ترتيب مستندات النشاط والفواتير والعقود وفهم نقاط الالتزام التي تحتاج مراجعة ضريبية أو محاسبية متخصصة قبل اتخاذ القرار.",
    requiredDocuments: ["بيانات النشاط", "العقود والفواتير", "أي مراسلات أو إخطارات ضريبية"],
    outcomes: ["خريطة أولية لنقاط الالتزام", "قائمة مستندات للمراجعة", "أسئلة منظمة للمستشار المختص"]
  },
  {
    areaKey: "criminal-defense",
    title: "الدفاع الجنائي",
    slug: "criminal-defense",
    category: "disputes",
    icon: "shield",
    description: "تنظيم وقائع البلاغات والمحاضر والمستندات مع مراعاة السرية وحقوق الأطراف.",
    content:
      "نراجع الوقائع والمستندات المتاحة ونساعد على ترتيب التسلسل الزمني والأسئلة المطلوبة للمراجعة القانونية، دون نشر بيانات شخصية أو تفاصيل حساسة.",
    requiredDocuments: ["بيانات المحضر أو البلاغ", "المستندات المؤيدة", "ملخص زمني للوقائع"],
    outcomes: ["تنظيم أولي للوقائع", "قائمة بيانات ناقصة", "أسئلة مراجعة واضحة"]
  },
  {
    areaKey: "labor-law",
    title: "قانون العمل",
    slug: "employment-compliance",
    category: "employment",
    icon: "badge",
    description: "مراجعة عقود العمل والسياسات الداخلية وإجراءات إنهاء العلاقة بما يقلل المخاطر.",
    content:
      "نساعد الشركات والموظفين على فهم الالتزامات والحقوق الأساسية وترتيب المستندات قبل اتخاذ خطوات رسمية أو تفاوضية.",
    requiredDocuments: ["عقد العمل", "السياسات الداخلية", "المراسلات أو الإنذارات"],
    outcomes: ["مراجعة أولية", "قائمة مخاطر", "اقتراح خطوات مطلوبة للمحامي"]
  },
  {
    areaKey: "commercial-contracts",
    title: "العقود التجارية",
    slug: "contract-drafting",
    category: "corporate",
    icon: "contract",
    description: "صياغة ومراجعة العقود التجارية مع تحديد المخاطر والبنود التي تحتاج تفاوضًا قبل التوقيع.",
    content:
      "نراجع العقود من زاوية الالتزامات، المسؤولية، الجزاءات، مواعيد التسليم، السرية، وآليات إنهاء التعاقد. الهدف هو أن يفهم العميل أثر كل بند قبل الالتزام به.",
    requiredDocuments: ["مسودة العقد", "السجل التجاري أو بيانات الأطراف", "أي مراسلات تفاوضية"],
    outcomes: ["ملاحظات قانونية منظمة", "قائمة بنود تحتاج تعديل", "صياغات بديلة عند الحاجة"]
  },
  {
    areaKey: "foreign-investment",
    title: "الاستثمار الأجنبي",
    slug: "foreign-investment",
    category: "corporate",
    icon: "public",
    description: "تنظيم المتطلبات القانونية للمستثمرين الأجانب ودخول السوق والشراكات المحلية.",
    content:
      "نراجع هيكل الدخول المقترح والبيانات المتاحة عن النشاط والشركاء والعقود الأولية، ثم نحدد نقاط المراجعة القانونية والتنظيمية قبل الالتزام.",
    requiredDocuments: ["وصف النشاط", "بيانات المستثمرين أو الشركاء", "مسودات الاتفاقات أو خطابات النوايا"],
    outcomes: ["ملخص هيكل قانوني أولي", "قائمة متطلبات ومستندات", "نقاط تحتاج مراجعة تنظيمية"]
  },
  {
    areaKey: "debt-recovery",
    title: "تحصيل الديون",
    slug: "debt-recovery",
    category: "disputes",
    icon: "payments",
    description: "تنظيم مستندات المديونية والمراسلات وخيارات المطالبة قبل اتخاذ أي إجراء.",
    content:
      "نراجع الفواتير والعقود وإثباتات التسليم والسداد والمراسلات، ونرتب ملف المطالبة بصورة تساعد على التفاوض أو المراجعة القانونية التالية.",
    requiredDocuments: ["الفواتير أو أوامر التوريد", "المراسلات", "العقد أو عرض السعر"],
    outcomes: ["جدول مديونية منظم", "قائمة مستندات داعمة", "مسارات مطالبة قابلة للمراجعة"]
  }
];

export const practiceAreaMatrix = legalServices.map((service) => ({
  key: service.areaKey,
  title: service.title,
  slug: service.slug,
  href: `/services/${service.slug}`,
  icon: service.icon,
  category: service.category,
  categoryLabel: serviceCategories[service.category] ?? service.category,
  summary: service.description
}));

export const lawyers = [
  {
    name: "أ. مريم خالد",
    slug: "maryam-khaled",
    title: "محامية عقود وشركات",
    bio: "تركز على صياغة العقود التجارية وحوكمة الشركات وتنظيم ملفات التفاوض قبل التوقيع.",
    specialties: ["صياغة العقود", "حوكمة الشركات", "مراجعة المخاطر"],
    languages: ["العربية", "الإنجليزية"],
    bookingEnabled: true,
    image: "/stitch-assets/ff4ca4cf707aef0c.png"
  },
  {
    name: "أ. كريم عادل",
    slug: "karim-adel",
    title: "محامي منازعات تجارية",
    bio: "يعمل على تنظيم ملفات المنازعات التجارية والتحصيل ومراجعة المستندات قبل الإجراءات.",
    specialties: ["المنازعات التجارية", "التحصيل", "التفاوض"],
    languages: ["العربية"],
    bookingEnabled: true,
    image: "/stitch-assets/b25c75c2e3f319cd.png"
  },
  {
    name: "أ. نادين سامي",
    slug: "nadine-samy",
    title: "استشارات عقارية وعمل",
    bio: "تركز على مراجعة مستندات الملكية وعقود العمل والسياسات الداخلية للشركات.",
    specialties: ["العقارات", "عقود العمل", "الامتثال"],
    languages: ["العربية", "الإنجليزية"],
    bookingEnabled: false,
    image: "/stitch-assets/b7457fddf1203399.png"
  }
];

export const articles = [
  {
    title: "أساسيات تقليل مخاطر العقود",
    slug: "contract-risk-basics",
    category: "contracts",
    excerpt: "نقاط عملية يجب فحصها قبل توقيع عقد تجاري أو توريد.",
    content:
      "تبدأ مراجعة العقد من فهم الالتزامات الأساسية ومواعيد التنفيذ والجزاءات وحدود المسؤولية. لا تكفي قراءة العنوان أو قيمة التعاقد؛ المهم هو أثر كل بند عند التعثر أو التأخير أو إنهاء العلاقة.",
    publishedAt: "2026-06-01",
    readTime: "5 دقائق"
  },
  {
    title: "كيف تجهز ملف استشارة قانونية",
    slug: "prepare-consultation-file",
    category: "intake",
    excerpt: "طريقة عملية لترتيب الوقائع والمستندات قبل مقابلة المحامي.",
    content:
      "الاستشارة تكون أوضح عندما تصل الوقائع مرتبة زمنيًا ومعها المستندات الأساسية والأسئلة المطلوبة. لا ترسل مستندات كثيرة دون توضيح الغرض منها؛ ابدأ بملخص قصير ثم أرفق ما يدعم كل واقعة.",
    publishedAt: "2026-06-08",
    readTime: "4 دقائق"
  },
  {
    title: "ملاحظات أولية قبل شراء عقار",
    slug: "before-real-estate-purchase",
    category: "real-estate",
    excerpt: "قائمة فحص مبدئية للمستندات والمخاطر قبل قرار الشراء.",
    content:
      "قبل شراء عقار، راجع سند الملكية وتسلسل التصرفات وأي التزامات أو نزاعات ظاهرة. هذه القائمة لا تغني عن المراجعة القانونية، لكنها تساعدك على تجهيز الأسئلة الصحيحة.",
    publishedAt: "2026-06-12",
    readTime: "6 دقائق"
  }
];

export const caseStudies = [
  {
    title: "تنظيم نزاع تجاري مجهول الأطراف",
    slug: "anonymous-commercial-dispute",
    category: "commercial",
    summary: "إعادة ترتيب مستندات ومراسلات نزاع توريد قبل مرحلة التفاوض.",
    challenge: "كانت الوقائع موزعة بين مراسلات وفواتير غير مرتبة، ما جعل تقييم الموقف صعبًا.",
    approach: "تم ترتيب الملف زمنيًا، وفصل المستندات المؤيدة لكل واقعة، وتحديد النقاط التي تحتاج مراجعة محام.",
    generalOutcome: "ساعد التنظيم على تقليل الغموض وتحديد مسار تفاوض أوضح دون تقديم وعود بنتيجة محددة.",
    lessons: "توثيق المراسلات وربطها بالمستندات يقلل النزاع عند مراجعة الالتزامات.",
    disclaimer: "هذه دراسة حالة مجهولة ومبسطة لأغراض توعوية فقط، ولا تتضمن بيانات عملاء أو نتيجة قانونية مضمونة."
  },
  {
    title: "مراجعة عقد خدمات قبل التوقيع",
    slug: "anonymous-service-contract-review",
    category: "contracts",
    summary: "مراجعة بنود مسؤولية وسرية وإنهاء قبل توقيع عقد خدمات.",
    challenge: "تضمن العقد بنودًا عامة لا توضح حدود المسؤولية أو طريقة إنهاء التعاقد.",
    approach: "تم تحديد البنود الغامضة واقتراح صياغات بديلة للمراجعة القانونية النهائية.",
    generalOutcome: "أصبح لدى العميل تصور أوضح عن نقاط التفاوض قبل الالتزام.",
    lessons: "البنود العامة تحتاج ربطًا بسيناريوهات تنفيذ واقعية.",
    disclaimer: "هذه دراسة حالة مجهولة ومبسطة ولا تمثل استشارة أو وعدًا بنتيجة."
  }
];

export const representativeMatters = [
  {
    areaKey: "real-estate",
    label: "عقارات",
    title: "مراجعة هيكل صفقة تطوير عقاري",
    region: "مصر",
    year: "2026",
    summary: "تنظيم مستندات الملكية ومراسلات التفاوض ونقاط التمويل لمراجعة قانونية أكثر وضوحًا.",
    href: "/services/real-estate-consultation",
    privacyNote: "مثال تمثيلي مجهول لا يعرض بيانات عملاء ولا يقدم وعدًا بنتيجة."
  },
  {
    areaKey: "foreign-investment",
    label: "استثمار أجنبي",
    title: "تجهيز ملف دخول مستثمر أجنبي للسوق",
    region: "المنطقة",
    year: "2026",
    summary: "ترتيب هيكل الدخول وبيانات الشركاء ومسودات الاتفاقات قبل المراجعة التنظيمية.",
    href: "/services/foreign-investment",
    privacyNote: "مثال تمثيلي مجهول ومبسط لأغراض التعريف بمجالات العمل."
  },
  {
    areaKey: "litigation",
    label: "تقاض",
    title: "تنظيم نزاع تجاري عالي القيمة",
    region: "مصر",
    year: "2026",
    summary: "جمع الوقائع والمراسلات والفواتير في ملف زمني يساعد على تقييم الخيارات القانونية.",
    href: "/services/commercial-disputes",
    privacyNote: "لا يتضمن المثال أسماء أطراف أو مستندات خاصة أو نتيجة قانونية مضمونة."
  }
];

export const mediaItems = [
  {
    title: "لقاء قصير: تجهيز ملف الاستشارة",
    type: "فيديو",
    date: "2026-06-05",
    description: "شرح مختصر لطريقة ترتيب الوقائع والمستندات قبل التواصل مع المكتب."
  },
  {
    title: "دليل سريع: مستندات العقود",
    type: "منشور",
    date: "2026-06-10",
    description: "قائمة توعوية بالمستندات الشائعة عند مراجعة عقد تجاري."
  },
  {
    title: "ندوة: مخاطر التوريد التجاري",
    type: "ندوة",
    date: "2026-06-18",
    description: "جلسة توعوية حول إدارة المخاطر في علاقات التوريد."
  }
];

export const publicIndustries = [
  {
    title: "الشركات العائلية والمتوسطة",
    summary: "حوكمة وعقود وشراكات وقرارات تساعد الإدارة على العمل بوثائق أوضح."
  },
  {
    title: "العقارات والتطوير",
    summary: "مراجعة مستندات ملكية وتعاقدات تطوير وإيجار ومشاركة قبل الالتزام."
  },
  {
    title: "التجارة والتوريد",
    summary: "عقود توريد وتحصيل ومديونيات ومنازعات تجارية مرتبطة بسلاسل البيع والشراء."
  },
  {
    title: "الشركات الناشئة والتقنية",
    summary: "تأسيس واتفاقات مساهمين وعقود خدمات وسياسات تشغيل قابلة للمراجعة."
  },
  {
    title: "الاستثمار عبر الحدود",
    summary: "تنظيم هياكل دخول السوق والشراكات والمستندات المطلوبة للمستثمرين."
  },
  {
    title: "الأفراد وأصحاب الأعمال",
    summary: "طلبات عقارية وعمل ومنازعات خاصة مع مراعاة الخصوصية وتقليل مشاركة البيانات الحساسة."
  }
];

export const branches = [
  {
    name: "فرع القاهرة",
    address: "وسط القاهرة، قريب من الجهات الإدارية والمحاكم الاقتصادية",
    phone: "+20 100 000 0001",
    email: "contact@kmtlegal.com"
  },
  {
    name: "اجتماعات أونلاين",
    address: "مواعيد مرنة عبر مكالمات فيديو بعد مراجعة الطلب",
    phone: "+20 100 000 0002",
    email: "booking@kmtlegal.com"
  }
];

export const publicFooterContent = {
  brandSummary: "حلول قانونية منظمة للشركات والمستثمرين والأفراد مع مراعاة السرية وعدم نشر بيانات العملاء.",
  practiceLinks: practiceAreaMatrix.map((area) => ({
    label: area.title,
    href: area.href
  })),
  offices: branches.map((branch) => ({
    name: branch.name,
    address: branch.address
  })),
  contact: {
    email: "contact@kmtlegal.com",
    bookingHref: "/book-consultation",
    note: "طلبات الاستشارة تبدأ من نموذج منظم ولا تمثل استشارة قانونية نهائية."
  },
  legalLinks: [
    { label: "سياسة الخصوصية", href: "/privacy" },
    { label: "الشروط", href: "/terms" }
  ]
};

export function navForPath(pathname: string) {
  return publicNavItems.map((item) => ({
    ...item,
    active: item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  }));
}

export function findBySlug<T extends { slug: string }>(items: T[], slug: string) {
  return items.find((item) => item.slug === slug);
}

export function publicSearchText(value: unknown) {
  return JSON.stringify(value).toLowerCase();
}
