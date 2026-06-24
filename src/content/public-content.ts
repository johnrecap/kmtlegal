export const publicNavItems = [
  { label: "الرئيسية", href: "/" },
  { label: "الخدمات", href: "/services" },
  { label: "الفريق", href: "/team" },
  { label: "المقالات", href: "/articles" },
  { label: "دراسات الحالة", href: "/case-studies" },
  { label: "الإعلام", href: "/media" },
  { label: "تواصل", href: "/contact" }
];

export const serviceCategories: Record<string, string> = {
  corporate: "الشركات والعقود",
  "real-estate": "العقارات",
  employment: "العمل",
  disputes: "المنازعات"
};

export const legalServices = [
  {
    title: "صياغة ومراجعة العقود",
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
    title: "الاستشارات العقارية",
    slug: "real-estate-consultation",
    category: "real-estate",
    icon: "real_estate_agent",
    description: "مراجعة موقف الملكية والتصرفات العقارية ومخاطر البيع أو الإيجار أو المشاركة.",
    content:
      "نساعد العملاء على فهم المستندات العقارية ومخاطر التسجيل والتصرفات السابقة قبل اتخاذ قرار قانوني أو تجاري.",
    requiredDocuments: ["مستند الملكية", "بطاقة الهوية", "العقود أو الإيصالات ذات الصلة"],
    outcomes: ["تقييم أولي للمستندات", "نقاط استفسار قبل التعاقد", "خطة مستندات مطلوبة"]
  },
  {
    title: "منازعات الشركات والتحصيل",
    slug: "commercial-disputes",
    category: "disputes",
    icon: "gavel",
    description: "تنظيم ملف النزاع التجاري ومراجعة المراسلات والمستندات قبل التصعيد أو التفاوض.",
    content:
      "نرتب الوقائع والمستندات ونحدد نقاط القوة والقصور، ثم نقترح مسارًا عمليًا للمراجعة القانونية الداخلية.",
    requiredDocuments: ["الفواتير أو أوامر التوريد", "المراسلات", "العقد أو عرض السعر"],
    outcomes: ["ملخص وقائع", "قائمة مستندات ناقصة", "اقتراح مسار مراجعة"]
  },
  {
    title: "علاقات العمل والامتثال",
    slug: "employment-compliance",
    category: "employment",
    icon: "badge",
    description: "مراجعة عقود العمل والسياسات الداخلية وإجراءات إنهاء العلاقة بما يقلل المخاطر.",
    content:
      "نساعد الشركات والموظفين على فهم الالتزامات والحقوق الأساسية قبل اتخاذ خطوات رسمية.",
    requiredDocuments: ["عقد العمل", "السياسات الداخلية", "المراسلات أو الإنذارات"],
    outcomes: ["مراجعة أولية", "قائمة مخاطر", "اقتراح خطوات مطلوبة للمحامي"]
  }
];

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
