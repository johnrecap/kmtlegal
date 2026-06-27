const serviceCategories = {
  corporate: "Corporate and transactions",
  disputes: "Litigation and disputes",
  "real-estate": "Real estate",
  employment: "Employment and compliance"
} as const;

const legalServices = [
  {
    areaKey: "corporate",
    title: "Corporate Law",
    slug: "corporate-law",
    category: "corporate",
    icon: "account_balance",
    description: "Legal support for formation, governance, restructuring, and day-to-day corporate decisions.",
    content:
      "We help companies organize documents, resolutions, and contractual relationships with clear risk review before material management or commercial decisions.",
    requiredDocuments: ["Commercial register or formation draft", "Shareholder or board resolutions", "Contracts or related correspondence"],
    outcomes: ["Structured legal summary", "Issues list for review or decision", "Suggested document and action plan"]
  },
  {
    areaKey: "litigation",
    title: "Litigation",
    slug: "commercial-disputes",
    category: "disputes",
    icon: "gavel",
    description: "Organizing commercial and civil dispute files before negotiation, escalation, or court action.",
    content:
      "We arrange facts, correspondence, and supporting documents, identify strengths and gaps, and prepare a practical review path without promising a specific outcome.",
    requiredDocuments: ["Contract or obligation source", "Correspondence and notices", "Invoices or supporting documents"],
    outcomes: ["Facts chronology", "Missing-document list", "Initial review path options"]
  },
  {
    areaKey: "arbitration",
    title: "Arbitration",
    slug: "arbitration",
    category: "disputes",
    icon: "balance",
    description: "Reviewing arbitration clauses and organizing local or international dispute files before proceedings.",
    content:
      "We review the arbitration clause, scope, prior correspondence, and core facts, then prepare the file for specialist legal review with documents and arguments in order.",
    requiredDocuments: ["Contract containing the arbitration clause", "Dispute notices", "Relevant correspondence and supporting documents"],
    outcomes: ["Initial arbitration clause read", "Jurisdiction and procedure issue list", "Organized document file"]
  },
  {
    areaKey: "real-estate",
    title: "Real Estate",
    slug: "real-estate-consultation",
    category: "real-estate",
    icon: "real_estate_agent",
    description: "Reviewing ownership position, real estate transactions, and sale, lease, or partnership risks.",
    content:
      "We help clients understand property documents, registration risks, previous dispositions, and visible obligations before a legal or commercial decision.",
    requiredDocuments: ["Ownership document", "Identity document or company details", "Related contracts or receipts"],
    outcomes: ["Initial document assessment", "Questions before signing", "Required document plan"]
  },
  {
    areaKey: "tax-advisory",
    title: "Tax Advisory",
    slug: "tax-advisory",
    category: "corporate",
    icon: "receipt_long",
    description: "Initial legal review of tax and contractual risks connected to business activities and transactions.",
    content:
      "We help clients organize activity records, invoices, and contracts and identify compliance points that need specialist tax or accounting review before decisions are made.",
    requiredDocuments: ["Business activity details", "Contracts and invoices", "Any tax correspondence or notices"],
    outcomes: ["Initial compliance map", "Document list for review", "Organized questions for the specialist adviser"]
  },
  {
    areaKey: "criminal-defense",
    title: "Criminal Defense",
    slug: "criminal-defense",
    category: "disputes",
    icon: "shield",
    description: "Organizing reports, investigations, and documents while respecting confidentiality and party rights.",
    content:
      "We review available facts and documents, organize the chronology, and prepare review questions without publishing personal data or sensitive details.",
    requiredDocuments: ["Report or complaint details", "Supporting documents", "Timeline summary of facts"],
    outcomes: ["Initial fact organization", "Missing-data list", "Clear review questions"]
  },
  {
    areaKey: "labor-law",
    title: "Labor Law",
    slug: "employment-compliance",
    category: "employment",
    icon: "badge",
    description: "Reviewing employment contracts, internal policies, and termination steps to reduce risk.",
    content:
      "We help companies and employees understand core obligations and rights and organize documents before formal or negotiation steps.",
    requiredDocuments: ["Employment contract", "Internal policies", "Correspondence or warnings"],
    outcomes: ["Initial review", "Risk list", "Suggested next steps for lawyer review"]
  },
  {
    areaKey: "commercial-contracts",
    title: "Commercial Contracts",
    slug: "contract-drafting",
    category: "corporate",
    icon: "contract",
    description: "Drafting and reviewing commercial contracts with focus on risks and clauses that need negotiation.",
    content:
      "We review contracts through obligations, liability, penalties, delivery timing, confidentiality, and termination mechanics so the client understands each clause before committing.",
    requiredDocuments: ["Contract draft", "Commercial register or party details", "Any negotiation correspondence"],
    outcomes: ["Organized legal comments", "Clauses requiring amendment", "Alternative drafting where needed"]
  },
  {
    areaKey: "foreign-investment",
    title: "Foreign Investment",
    slug: "foreign-investment",
    category: "corporate",
    icon: "public",
    description: "Organizing legal requirements for foreign investors, market entry, and local partnerships.",
    content:
      "We review the proposed entry structure, available business and partner information, and draft agreements, then identify legal and regulatory review points before commitment.",
    requiredDocuments: ["Business activity description", "Investor or partner details", "Draft agreements or letters of intent"],
    outcomes: ["Initial legal structure summary", "Requirements and documents list", "Regulatory review points"]
  },
  {
    areaKey: "debt-recovery",
    title: "Debt Recovery",
    slug: "debt-recovery",
    category: "disputes",
    icon: "payments",
    description: "Organizing debt documents, correspondence, and claim options before taking any step.",
    content:
      "We review invoices, contracts, delivery and payment evidence, and correspondence, then arrange the claim file for negotiation or the next legal review.",
    requiredDocuments: ["Invoices or purchase orders", "Correspondence", "Contract or quotation"],
    outcomes: ["Organized debt schedule", "Supporting-document list", "Claim paths ready for review"]
  }
] as const;

const practiceAreaMatrix = legalServices.map((service) => ({
  key: service.areaKey,
  title: service.title,
  slug: service.slug,
  href: `/services/${service.slug}`,
  icon: service.icon,
  category: service.category,
  categoryLabel: serviceCategories[service.category] ?? service.category,
  summary: service.description
}));

const lawyers = [
  {
    name: "Maryam Khaled",
    slug: "maryam-khaled",
    title: "Corporate and Contracts Lawyer",
    bio: "Focuses on commercial contracts, corporate governance, and organized negotiation files before signing.",
    specialties: ["Contract drafting", "Corporate governance", "Risk review"],
    languages: ["Arabic", "English"],
    bookingEnabled: true,
    image: "/stitch-assets/ff4ca4cf707aef0c.png"
  },
  {
    name: "Karim Adel",
    slug: "karim-adel",
    title: "Commercial Disputes Lawyer",
    bio: "Works on commercial dispute files, recovery matters, and document review before formal action.",
    specialties: ["Commercial disputes", "Recovery", "Negotiation"],
    languages: ["Arabic"],
    bookingEnabled: true,
    image: "/stitch-assets/b25c75c2e3f319cd.png"
  },
  {
    name: "Nadine Samy",
    slug: "nadine-samy",
    title: "Real Estate and Employment Advisory",
    bio: "Focuses on ownership documents, employment contracts, and internal policy review for companies.",
    specialties: ["Real estate", "Employment contracts", "Compliance"],
    languages: ["Arabic", "English"],
    bookingEnabled: false,
    image: "/stitch-assets/b7457fddf1203399.png"
  }
] as const;

const articles = [
  {
    title: "Contract Risk Basics",
    slug: "contract-risk-basics",
    category: "contracts",
    excerpt: "Practical points to review before signing a commercial or supply contract.",
    content:
      "Contract review starts with understanding core obligations, timelines, penalties, and liability limits. The title or transaction value is not enough; what matters is how each clause works if delivery, delay, or termination becomes disputed.",
    publishedAt: "2026-06-01",
    readTime: "5 min read"
  },
  {
    title: "How To Prepare A Legal Consultation File",
    slug: "prepare-consultation-file",
    category: "intake",
    excerpt: "A practical way to organize facts and documents before meeting a lawyer.",
    content:
      "A consultation is clearer when facts arrive in chronological order with the core documents and questions attached. Do not send a large document bundle without explaining its purpose; start with a short summary, then attach what supports each fact.",
    publishedAt: "2026-06-08",
    readTime: "4 min read"
  },
  {
    title: "Initial Notes Before Buying Real Estate",
    slug: "before-real-estate-purchase",
    category: "real-estate",
    excerpt: "A preliminary document and risk checklist before a purchase decision.",
    content:
      "Before buying real estate, review title documents, the chain of transactions, and any visible obligations or disputes. This checklist does not replace legal review, but it helps you prepare the right questions.",
    publishedAt: "2026-06-12",
    readTime: "6 min read"
  }
] as const;

const caseStudies = [
  {
    title: "Organizing An Anonymous Commercial Dispute",
    slug: "anonymous-commercial-dispute",
    category: "commercial",
    summary: "Reordering supply-dispute documents and correspondence before negotiation.",
    challenge: "The facts were spread across unorganized correspondence and invoices, making position assessment difficult.",
    approach: "The file was arranged chronologically, supporting documents were grouped by fact, and lawyer-review questions were identified.",
    generalOutcome: "The organization reduced ambiguity and clarified a negotiation path without promising a specific legal result.",
    lessons: "Linking correspondence to documents reduces disputes when obligations are reviewed.",
    disclaimer: "This is an anonymized, simplified case study for educational purposes only. It does not include client data or promise a legal result."
  },
  {
    title: "Reviewing A Services Contract Before Signing",
    slug: "anonymous-service-contract-review",
    category: "contracts",
    summary: "Reviewing liability, confidentiality, and termination clauses before signing a services contract.",
    challenge: "The contract contained broad clauses that did not clearly define liability limits or termination mechanics.",
    approach: "Ambiguous clauses were identified and alternative drafting points were prepared for final legal review.",
    generalOutcome: "The client had a clearer view of negotiation points before commitment.",
    lessons: "Generic clauses should be linked to realistic implementation scenarios.",
    disclaimer: "This anonymized and simplified case study is not legal advice and does not promise an outcome."
  }
] as const;

const representativeMatters = [
  {
    areaKey: "real-estate",
    label: "Real Estate",
    title: "Reviewed A Real Estate Development Transaction Structure",
    region: "Egypt",
    year: "2026",
    summary: "Organized ownership documents, negotiation correspondence, and financing points for clearer legal review.",
    href: "/services/real-estate-consultation",
    privacyNote: "An anonymized illustrative example that does not display client data or promise a result."
  },
  {
    areaKey: "foreign-investment",
    label: "Foreign Investment",
    title: "Prepared A Market-Entry File For A Foreign Investor",
    region: "Region",
    year: "2026",
    summary: "Structured entry model, partner details, and agreement drafts before regulatory review.",
    href: "/services/foreign-investment",
    privacyNote: "A simplified anonymized example for explaining practice areas."
  },
  {
    areaKey: "litigation",
    label: "Litigation",
    title: "Organized A High-Value Commercial Dispute",
    region: "Egypt",
    year: "2026",
    summary: "Collected facts, correspondence, and invoices into a timeline that supported option assessment.",
    href: "/services/commercial-disputes",
    privacyNote: "No party names, private documents, or guaranteed legal result are included."
  }
] as const;

const mediaItems = [
  {
    title: "Short Talk: Preparing A Consultation File",
    type: "Video",
    date: "2026-06-05",
    description: "A concise explanation of how to organize facts and documents before contacting the office."
  },
  {
    title: "Quick Guide: Contract Documents",
    type: "Post",
    date: "2026-06-10",
    description: "An awareness checklist of common documents needed when reviewing a commercial contract."
  },
  {
    title: "Seminar: Commercial Supply Risks",
    type: "Seminar",
    date: "2026-06-18",
    description: "An awareness session on managing risk in supply relationships."
  }
] as const;

const publicIndustries = [
  { title: "Family and mid-sized companies", summary: "Governance, contracts, partnerships, and decisions supported by clearer documentation." },
  { title: "Real estate and development", summary: "Ownership, development, lease, and partnership document review before commitment." },
  { title: "Trade and supply", summary: "Supply contracts, recovery, debts, and commercial disputes tied to sales and purchasing chains." },
  { title: "Startups and technology", summary: "Formation, shareholder arrangements, service contracts, and operational policies ready for review." },
  { title: "Cross-border investment", summary: "Market-entry structures, partnerships, and investor document requirements." },
  { title: "Individuals and business owners", summary: "Private real estate, employment, and dispute requests with privacy and data minimization in mind." }
] as const;

const branches = [
  {
    name: "Cairo Office",
    address: "Central Cairo, close to administrative bodies and economic courts",
    phone: "+20 100 000 0001",
    email: "contact@kmtlegal.com"
  },
  {
    name: "Online Meetings",
    address: "Flexible video-call appointments after request review",
    phone: "+20 100 000 0002",
    email: "booking@kmtlegal.com"
  }
] as const;

const footerContent = {
  brandSummary: "Structured legal support for companies, investors, and individuals, with confidentiality and no publication of client data.",
  practiceLinks: practiceAreaMatrix.map((area) => ({ label: area.title, href: area.href })),
  offices: branches.map((branch) => ({ name: branch.name, address: branch.address })),
  contact: {
    email: "contact@kmtlegal.com",
    bookingHref: "/book-consultation",
    note: "Consultation requests begin with a structured form and do not create final legal advice."
  },
  legalLinks: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms", href: "/terms" }
  ]
} as const;

export const publicContentEn = {
  navItems: [
    { label: "Home", href: "/" },
    { label: "Practice Areas", href: "/services" },
    { label: "Team", href: "/team" },
    { label: "Insights", href: "/articles" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Media", href: "/media" },
    { label: "Contact", href: "/contact" }
  ],
  serviceCategories,
  legalServices,
  practiceAreaMatrix,
  lawyers,
  articles,
  caseStudies,
  representativeMatters,
  mediaItems,
  publicIndustries,
  branches,
  footerContent,
  shell: {
    consultationCta: "Book a Consultation",
    mainNavLabel: "Main navigation",
    compactNavLabel: "Compact navigation",
    footerCtaTitle: "Need clear legal support?",
    footerCtaDescription: "Start with a structured request, and the team will review the details before confirming the right contact or booking path.",
    confidentiality: "Data confidentiality",
    humanReview: "Human review",
    practiceLinksLabel: "Practice area links",
    practiceLinksTitle: "Practice Areas",
    viewAllPracticeAreas: "View All Practice Areas",
    officesTitle: "Offices",
    contactTitle: "Contact Us",
    hours: "Sunday - Thursday, 9:00 AM - 6:00 PM",
    copyright: "© 2026 KMT Legal. All rights reserved.",
    privacy: "Privacy",
    terms: "Terms",
    languageSwitchLabel: "العربية"
  },
  shared: {
    bookConsultation: "Book a Consultation",
    browsePracticeAreas: "Browse Practice Areas",
    viewDetails: "View Details",
    clearFilters: "Clear Filters",
    noLegalAdvice: "This content is for general awareness and does not replace lawyer review based on the facts and documents.",
    notFound: "The requested item was not found."
  },
  home: {
    metadataTitle: "KMT Legal | Comprehensive Legal Expertise Across Critical Sectors",
    metadataDescription: "Structured legal consultation, corporate, contract, real estate, dispute, and booking support from KMT Legal.",
    heroEyebrow: "Practice Areas",
    heroTitle: "Comprehensive Legal Expertise Across Critical Sectors",
    heroDescription:
      "We provide strategic and practical legal support for companies, investors, and individuals, from organizing facts and documents to setting a clear review path.",
    trustItems: [
      { icon: "verified_user", label: "Human review before any legal decision" },
      { icon: "lock", label: "Client data and documents are not published" },
      { icon: "schedule", label: "Organized follow-up from request to appointment" }
    ],
    practiceEyebrow: "Our Practice Areas",
    practiceTitle: "Legal Practice Areas",
    practiceDescription: "A clear service structure helps you choose the closest path for your request while protecting privacy and client data.",
    focusEyebrow: "Focus Area",
    approachEyebrow: "Our Approach",
    approachTitle: "From first request to clear next steps",
    approachDescription: "The site does not promise outcomes. It organizes the starting point and makes communication with the team clearer.",
    representativeEyebrow: "Representative Matters",
    representativeTitle: "Recent Representative Matters",
    representativeDescription: "Anonymized and simplified examples that show the type of files handled by the office without revealing client data.",
    industriesEyebrow: "Industries",
    industriesTitle: "Industries We Serve",
    industriesDescription: "The dark visual language does not change the product: the content remains legal, clear, and directed toward practical business decisions.",
    teamEyebrow: "Team",
    teamTitle: "A practical specialist legal team",
    teamDescription: "Explore available expertise paths for booking or initial review.",
    insightsEyebrow: "Insights",
    insightsTitle: "Legal Awareness Without Promises",
    insightsDescription: "Published administrative content only appears when it is approved and available in the current language.",
    caseStudyAnonymous: "Anonymous case study",
    finalCtaTitle: "Need Legal Support for Your Business?",
    finalCtaDescription: "Our team is ready to receive a structured request and review initial details before confirming an appointment or next step.",
    approachSteps: [
      { number: "01", title: "Consultation", summary: "We listen to the facts and identify the goal and required information before any recommendation.", icon: "groups" },
      { number: "02", title: "Strategy", summary: "We organize legal options into a practical path aligned with business goals.", icon: "strategy" },
      { number: "03", title: "Execution", summary: "We review documents and steps while reducing risk and closing gaps.", icon: "contract_edit" },
      { number: "04", title: "Resolution", summary: "We move the file toward a practical result with clear follow-up.", icon: "target" }
    ]
  },
  servicesPage: {
    metadataTitle: "Legal Services | KMT Legal",
    metadataDescription: "Legal services in contracts, companies, real estate, employment, and commercial disputes.",
    heroEyebrow: "Services",
    heroTitle: "Filterable Legal Services",
    heroDescription: "Start from the file type or search directly for the service closest to your need, then submit a structured request for human review.",
    sectionEyebrow: "Services",
    sectionTitle: "Choose the closest path for your request",
    sectionDescription: "Use search or category filters to reach the right service, then start a structured consultation request.",
    searchLabel: "Search services",
    emptyTitle: "No matching services"
  },
  serviceDetail: {
    documentsTitle: "Documents That Help Review",
    outcomesTitle: "Expected Outputs",
    backToServices: "Back to Practice Areas"
  },
  teamPage: {
    metadataTitle: "KMT Legal Team",
    metadataDescription: "Learn about KMT Legal lawyers and their available review and booking specialties.",
    heroEyebrow: "Team",
    heroTitle: "Legal Team With Clear Specialties",
    heroDescription: "Review specialties before booking so your request reaches the right lawyer from the beginning.",
    sectionEyebrow: "Team",
    sectionTitle: "Clear specialties before booking",
    sectionDescription: "Choose a lawyer by request area or review all available specialties.",
    searchLabel: "Search the team",
    emptyTitle: "No matching profiles",
    bookingAvailable: "Available for booking",
    officeReview: "Office review"
  },
  teamDetail: {
    specialtiesTitle: "Specialties",
    languagesTitle: "Languages",
    bookingNotice: "The lawyer and appointment are confirmed after request review. Booking does not mean final acceptance of the file.",
    relationshipNotice: "Team profiles are for specialty overview only and do not create a lawyer-client relationship before office acceptance.",
    requestConsultation: "Request Consultation"
  },
  articlesPage: {
    metadataTitle: "Legal Articles | KMT Legal",
    metadataDescription: "Awareness articles that help you prepare questions and documents before lawyer review.",
    heroEyebrow: "Insights",
    heroTitle: "Practical Legal Reading",
    heroDescription: "Awareness articles that help you prepare questions and documents before contacting the office.",
    sectionEyebrow: "Insights",
    sectionTitle: "Practical Legal Reading",
    sectionDescription: "The content is educational and does not provide final legal advice.",
    searchLabel: "Search articles",
    emptyTitle: "No matching articles"
  },
  articleDetail: {
    disclaimer: "This article is for general awareness and does not replace lawyer review based on the facts and documents.",
    backToArticles: "Back to Articles"
  },
  caseStudiesPage: {
    metadataTitle: "Anonymous Case Studies | KMT Legal",
    metadataDescription: "Anonymized and simplified case studies without client data or promised legal outcomes.",
    heroEyebrow: "Case Studies",
    heroTitle: "Anonymous Files Without Revealing Data",
    heroDescription: "Read simplified examples from legal files while protecting client names, documents, and case numbers.",
    sectionEyebrow: "Case Studies",
    sectionTitle: "Learn From Anonymous Files",
    sectionDescription: "Every published case study here is anonymized and simplified, without client data, documents, or case numbers.",
    searchLabel: "Search case studies",
    emptyTitle: "No matching studies",
    anonymousMeta: "Anonymous"
  },
  caseStudyDetail: {
    eyebrow: "Anonymous case study",
    challenge: "Challenge",
    approach: "Approach",
    generalOutcome: "General Outcome",
    lessons: "Lessons",
    backToCaseStudies: "Back to Case Studies"
  },
  mediaPage: {
    metadataTitle: "Media and Content | KMT Legal",
    metadataDescription: "Read-only media wall for awareness content, seminars, and posts.",
    heroEyebrow: "Media",
    heroTitle: "Read-Only Awareness Content",
    heroDescription: "Organized follow-up for seminars and public posts without external publishing integration at this stage.",
    sectionEyebrow: "Media",
    sectionTitle: "Organized Awareness Content",
    sectionDescription: "A read-only page for general media content, without external publishing or social integration at this stage."
  },
  contactPage: {
    metadataTitle: "Contact KMT Legal",
    metadataDescription: "KMT Legal contact details, offices, and general contact form.",
    heroEyebrow: "Contact",
    heroTitle: "Clear Contact From The First Message",
    heroDescription: "Send a general question or book a consultation if the request needs structured legal review.",
    sectionEyebrow: "Contact",
    sectionTitle: "Start With A Clear Message",
    sectionDescription: "Use the contact form for general questions. For legal consultations, use the structured booking form."
  },
  bookingPage: {
    metadataTitle: "Book a Consultation | KMT Legal",
    metadataDescription: "Structured legal consultation booking form with human review and internal AI organization.",
    heroEyebrow: "Consultation Request",
    heroTitle: "Write Your Request In A Few Steps",
    heroDescription: "The form organizes your details for human review. It does not provide final legal advice before the team contacts you.",
    sectionEyebrow: "Consultation Request",
    sectionTitle: "Write Your Request In A Few Steps",
    sectionDescription: "The form stores data in an organized way and may use an internal assistant to prepare the request for human review. Do not send documents now.",
    afterSubmitTitle: "What happens after submission?",
    afterSubmitSteps: [
      "The request is saved as a new review item.",
      "The assistant prepares an initial summary that still needs lawyer review.",
      "The team contacts you to confirm suitability and timing.",
      "If accepted, the file may later become a client and case inside the admin system."
    ],
    requestedLawyer: "Requested lawyer"
  },
  privacyPage: {
    metadataTitle: "Privacy Policy | KMT Legal",
    metadataDescription: "KMT Legal privacy policy for consultation, contact, and file data.",
    eyebrow: "Privacy",
    title: "How We Handle Your Data",
    description: "This page explains how data is used in contact and consultation services and requires periodic legal review under office policies.",
    blocks: [
      { title: "Data We Receive", body: "We may receive name, phone number, email, city, request summary, and preferred contact method when a consultation or contact form is submitted." },
      { title: "Purpose Of Use", body: "We use the data to review the request, contact you, organize appointments, and improve internal workflow. Client data and documents are not published on public pages." },
      { title: "Artificial Intelligence", body: "The system may use an internal AI gateway to organize the request initially. Outputs are assistive only, require lawyer review, and are not final legal advice." },
      { title: "Legal Files", body: "Files are uploaded only through a protected portal later, stored in private server space, and not served directly from Nginx or the public folder." }
    ]
  },
  termsPage: {
    metadataTitle: "Terms and Notices | KMT Legal",
    metadataDescription: "KMT Legal website terms and notices for public content and consultation forms.",
    eyebrow: "Terms",
    title: "Website Use Notices",
    description: "This page explains the limits of public content and contact forms, and what may be relied on before office review.",
    blocks: [
      { title: "No Final Advice Through The Website", body: "Public content and request forms do not provide final legal advice and do not create a lawyer-client relationship before the office accepts the file." },
      { title: "No Outcome Promises", body: "Any examples or published case studies are educational and anonymized, and do not guarantee a similar result." },
      { title: "Data Accuracy", body: "The sender is responsible for providing accurate and updated data that supports initial review." },
      { title: "Human Review", body: "Any automated organization or assistant summary requires human review before use in a legal decision." }
    ]
  },
  directoryFilter: {
    defaultSearchLabel: "Search",
    placeholder: "Type a search term",
    all: "All",
    emptyDescription: "No results match the current search or category. Clear filters to return to all items."
  },
  contactForm: {
    fullName: "Full Name",
    email: "Email",
    phone: "Phone Number",
    topic: "Topic",
    message: "Message",
    topics: { consultation: "Consultation request", documents: "Document question", media: "Media or content", other: "Other topic" },
    hint: "Do not send documents or sensitive data through the public contact form.",
    consent: "I agree to use this data for contact about the message under the privacy policy.",
    submit: "Send Message",
    newMessage: "New Message",
    fallbackError: "The message could not be sent. Review the details and try again.",
    success: "Your message has been received. The team will contact you after review."
  },
  bookingForm: {
    steps: ["Contact details", "Request details", "Review and send"],
    fullName: "Full Name",
    phone: "Phone Number",
    email: "Email",
    city: "City",
    serviceCategory: "Request Area",
    urgency: "Urgency",
    preferredMode: "Contact Method",
    opposingPartyName: "Opposing party name, if any",
    summary: "Request Summary",
    categories: { corporate: "Corporate and contracts", "real-estate": "Real estate", employment: "Employment", disputes: "Disputes" },
    urgencyLabels: { LOW: "Low", NORMAL: "Normal", HIGH: "High", URGENT: "Urgent" },
    preferredModeLabels: { PHONE: "Phone", ONLINE: "Online", OFFICE: "Office" },
    summaryHintShort: "Write {count} more characters at minimum. Mention the main fact, date, or requested action without attaching documents.",
    summaryHintReady: "The summary is sufficient to continue. Do not send documents or highly sensitive data at this stage.",
    reviewLabels: { name: "Name", phone: "Phone", category: "Area", urgency: "Urgency", mode: "Contact method", summary: "Summary" },
    missing: "Incomplete",
    consent: "I agree to use the data to review the request and contact me about it, and I understand the form does not provide final legal advice.",
    submit: "Send Request",
    continue: "Continue",
    back: "Back",
    successTitle: "Consultation request sent",
    reference: "Reference",
    organizerTitle: "Initial Request Organization",
    organizerReady: "The request summary was saved and organized to help the office team review and contact you.",
    categoryLabel: "Initial area",
    urgencyLabel: "Urgency",
    organizerUnavailable: "The request was saved and will be organized manually if the assistant is unavailable.",
    validation: {
      fullName: "Write the full name so we know who owns the request.",
      phone: "Write a valid phone number so we can contact you.",
      email: "Write a valid email address or leave the field empty.",
      summary: "The summary is short. Write at least {min} characters so the team can review the request.",
      consent: "You must agree to data use before sending the request."
    },
    fallbackError: "The consultation request could not be sent. Review the details and try again.",
    unknown: "Not specified",
    unknownFeminine: "Not specified"
  }
} as const;
