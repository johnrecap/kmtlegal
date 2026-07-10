import { publicLegalServicesEn as legalServices, publicServiceCategoriesEn as serviceCategories } from "./public-services";

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
    title: "How To Prepare A Consultation Request",
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
    areaKey: "real-estate-legal-support",
    label: "Real Estate Legal Review",
    title: "Reviewed A Real Estate Transaction File",
    region: "Egypt",
    year: "2026",
    summary: "Organized ownership documents, sale terms, and correspondence for clearer office review.",
    href: "/services/real-estate-legal-support",
    privacyNote: "An anonymized illustrative example that does not display client data or promise a result."
  },
  {
    areaKey: "corporate-business-services",
    label: "Companies & Commercial Contracts",
    title: "Prepared A Company And Contract Review File",
    region: "Region",
    year: "2026",
    summary: "Structured company details, contract drafts, and governance questions before lawyer assignment.",
    href: "/services/corporate-business-services",
    privacyNote: "A simplified anonymized example for explaining services."
  },
  {
    areaKey: "claims-collections",
    label: "Debt Claims & Settlement",
    title: "Organized A Claims And Collection Request",
    region: "Egypt",
    year: "2026",
    summary: "Collected debt documents, correspondence, and payment history into a file ready for review.",
    href: "/services/claims-collections",
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
    name: "Cairo Office Visits",
    address: "Cairo office visits by confirmed appointment.",
    phone: "Use the consultation request form",
    email: "contact@kmtlegal.com"
  },
  {
    name: "Remote Meetings",
    address: "Online meetings are arranged after request review and appointment confirmation.",
    phone: "Confirmed by the office team",
    email: "booking@kmtlegal.com"
  }
] as const;

const footerContent = {
  brandSummary: "Structured legal support for companies, investors, and individuals, with intake, document review, and office follow-up.",
  practiceLinks: practiceAreaMatrix.map((area) => ({ label: area.title, href: area.href })),
  offices: branches.map((branch) => ({ name: branch.name, address: branch.address })),
  contact: {
    email: "contact@kmtlegal.com",
    phone: "By confirmed appointment",
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
    { label: "Services", href: "/services" },
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
    consultationCta: "Request a Consultation",
    clientLoginCta: "Client Login",
    mainNavLabel: "Main navigation",
    compactNavLabel: "Compact navigation",
    footerCtaTitle: "Ready to discuss a legal matter?",
    footerCtaDescription: "Send a structured request so the office can review the matter before confirming the suitable contact or appointment path.",
    confidentiality: "Data confidentiality",
    humanReview: "Human review",
    practiceLinksLabel: "Service links",
    practiceLinksTitle: "Services",
    viewAllPracticeAreas: "View All Services",
    officesTitle: "Offices",
    contactTitle: "Contact Us",
    hours: "Sunday - Thursday, 9:00 AM - 6:00 PM",
    copyright: "© 2026 KMT Legal. All rights reserved.",
    privacy: "Privacy Policy",
    terms: "Terms",
    languageSwitchLabel: "العربية"
  },
  shared: {
    bookConsultation: "Request a Consultation",
    browsePracticeAreas: "Browse Services",
    viewDetails: "View Details",
    clearFilters: "Clear Filters",
    noLegalAdvice: "This content is for general awareness and does not replace lawyer review based on the facts and documents.",
    notFound: "The requested item was not found."
  },
  home: {
    metadataTitle: "KMT Legal | Structured Legal Support for Business and Private Matters",
    metadataDescription: "Structured legal consultation, corporate, contract, real estate, dispute, and booking support from KMT Legal.",
    heroEyebrow: "Services",
    heroTitle: "Structured Legal Support for Business and Private Matters",
    heroDescription:
      "Submit your matter through a clear intake process. The office reviews the facts and documents before confirming the suitable next step.",
    trustItems: [
      { icon: "verified_user", label: "Reviewed by the office before any legal step" },
      { icon: "lock", label: "Client information is handled confidentially" },
      { icon: "schedule", label: "Clear follow-up from request to appointment" }
    ],
    practiceEyebrow: "Our Services",
    practiceTitle: "Legal Services by Matter Type",
    practiceDescription: "Choose the service closest to your matter, then send a structured consultation request for office review.",
    focusEyebrow: "Focus Area",
    approachEyebrow: "Our Approach",
    approachTitle: "How the request is handled",
    approachDescription: "The website organizes intake; legal advice and file acceptance happen only after office review.",
    representativeEyebrow: "Representative Matters",
    representativeTitle: "Recent Representative Matters",
    representativeDescription: "Anonymized and simplified examples that show the type of service requests handled by the office without revealing client data.",
    industriesEyebrow: "Industries",
    industriesTitle: "Industries We Serve",
    industriesDescription: "We help clients make clearer decisions through document review, risk assessment, and practical next steps.",
    teamEyebrow: "Team",
    teamTitle: "A practical specialist legal team",
    teamDescription: "Explore available expertise paths for booking or initial review.",
    insightsEyebrow: "Insights",
    insightsTitle: "Legal Awareness Without Promises",
    insightsDescription: "Published administrative content only appears when it is approved and available in the current language.",
    caseStudyAnonymous: "Anonymous case study",
    finalCtaTitle: "Ready to discuss a legal matter?",
    finalCtaDescription: "Send a structured request so the office can review the matter before confirming the suitable contact or appointment path.",
    approachSteps: [
      { number: "01", title: "Intake", summary: "We receive the facts, contact details, and key question in an organized form.", icon: "groups" },
      { number: "02", title: "Initial Review", summary: "The office reviews the matter and identifies the documents or clarifications needed.", icon: "strategy" },
      { number: "03", title: "Next Steps", summary: "The team outlines the suitable review path and appointment or follow-up requirements.", icon: "contract_edit" },
      { number: "04", title: "Follow-up", summary: "The matter stays organized while the office confirms the next practical steps.", icon: "target" }
    ]
  },
  servicesPage: {
    metadataTitle: "Legal Services | KMT Legal",
    metadataDescription: "KMT Legal services in legal consultation, companies, contracts, real estate, claims, and collections.",
    heroEyebrow: "Services",
    heroTitle: "Find the Closest Service Path",
    heroDescription: "Start from the matter type or search for the service closest to your need, then submit a structured request for office review.",
    sectionEyebrow: "Services",
    sectionTitle: "Find the Closest Service Path",
    sectionDescription: "Use the service names and matter areas to reach the right path, then start a structured consultation request.",
    searchLabel: "Search by service or matter",
    emptyTitle: "No matching services",
    servicesCountLabel: "services"
  },
  serviceDetail: {
    includedTitle: "Services included",
    documentsTitle: "Documents That Help Review",
    outcomesTitle: "Expected Outputs",
    backToServices: "Back to Services"
  },
  teamPage: {
    metadataTitle: "KMT Legal Team",
    metadataDescription: "Learn about KMT Legal lawyers and their available review and booking specialties.",
    heroEyebrow: "Team",
    heroTitle: "Lawyers With Defined Practice Areas",
    heroDescription: "Review specialties before booking so your request reaches the right lawyer from the beginning.",
    sectionEyebrow: "Team",
    sectionTitle: "Practice areas before requesting a consultation",
    sectionDescription: "Choose a lawyer by request area or review all available specialties.",
    searchLabel: "Search the team",
    emptyTitle: "No matching profiles",
    bookingAvailable: "Available after office review",
    officeReview: "Office review required"
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
    metadataDescription: "Legal awareness content, seminars, and office updates.",
    heroEyebrow: "Media",
    heroTitle: "Legal Awareness and Office Updates",
    heroDescription: "Articles, talks, and public updates that help clients prepare questions before contacting the office.",
    sectionEyebrow: "Media",
    sectionTitle: "Legal Awareness and Office Updates",
    sectionDescription: "Public legal awareness content from the office for preparation and general understanding."
  },
  contactPage: {
    metadataTitle: "Contact KMT Legal",
    metadataDescription: "KMT Legal contact details, offices, and general contact form.",
    heroEyebrow: "Contact",
    heroTitle: "Contact the Office",
    heroDescription: "Send a general message, or request a consultation if the matter needs structured legal review.",
    sectionEyebrow: "Contact",
    sectionTitle: "Contact the Office",
    sectionDescription: "Use the contact form for general questions. For legal consultations, use the structured booking form."
  },
  bookingPage: {
    metadataTitle: "Request an Initial Consultation | KMT Legal",
    metadataDescription: "Request an initial consultation through a focused intake assistant with office review and no legal advice from AI.",
    heroEyebrow: "Consultation Request",
    heroTitle: "Request an Initial Consultation",
    heroDescription: "The intake assistant collects the details needed for office review. It does not provide legal advice before the team contacts you.",
    manualHeroDescription: "Use the booking chat to provide the required details, then the appointment is confirmed without a booking fee.",
    sectionEyebrow: "Consultation Request",
    sectionTitle: "Start with the Consultation Assistant",
    sectionDescription: "Use one clear conversation to request a consultation or check a previous reference. Do not send documents now.",
    manualSectionTitle: "Book Through Chat Without A Fee",
    manualSectionDescription: "The chat collects the name, phone, request text, and appointment time, then shows a reference for secretary review and assignment.",
    afterSubmitTitle: "What happens after submission?",
    afterSubmitSteps: [
      "The request is saved as a new review item.",
      "The assistant prepares an initial summary that still needs lawyer review.",
      "The team contacts you to confirm suitability and timing.",
      "If accepted, the file may later become a client and case inside the admin system."
    ],
    requestedLawyer: "Requested lawyer"
  },
  bookingChat: {
    heroTitle: "Request an Initial Consultation",
    heroDescription: "A focused intake assistant collects the details the office needs for review. It does not provide legal advice.",
    sectionTitle: "Start with the Consultation Assistant",
    sectionDescription: "Use the conversation to request a consultation or check a previous reference. The team reviews every request before confirming next steps.",
    title: "Consultation request assistant",
    assistantName: "KMT Consultation Assistant",
    status: "Booking only",
    scope: "Booking and reference checks only. No legal advice.",
    onlineNow: "Assistant available",
    humanReviewOnly: "Human review only",
    noLegalAdvice: "No legal advice",
    secureConfidential: "Confidential intake",
    humanReviewBadge: "Human Review",
    fastResponse: "Reviewed follow-up",
    languagePrompt: "Please choose the conversation language. / من فضلك اختر لغة المحادثة.",
    languageArabic: "العربية",
    languageEnglish: "English",
    greeting: "Hello. I can help you book a consultation or check a previous booking reference. I will collect only the details needed for team review.",
    book: "Book consultation",
    inquire: "Check reference",
    corporateLaw: "Companies & commercial contracts",
    litigation: "Debt claims & settlement",
    messageLabel: "Message",
    messagePlaceholder: "Type a booking request or reference question",
    languagePendingPlaceholder: "Choose Arabic or English to start",
    send: "Send",
    contactTitle: "Contact details",
    contactPrompt: "Please add your contact details so the team can identify the request.",
    detailsTitle: "Request details",
    detailsPrompt: "Now add the consultation area and a short summary for human review.",
    reviewTitle: "Review and send",
    reviewPrompt: "Review the details, confirm consent, then send the request.",
    inquiryTitle: "Reference check",
    inquiryPrompt: "Add the booking reference and the phone or email used in the request.",
    legalRefusal: "I cannot provide a legal opinion, interpret documents, or predict outcomes here. I can book a consultation so the office team can review your request.",
    scopeReply: "I can help with booking a consultation or checking a booking reference only.",
    continue: "Continue",
    back: "Back",
    submitRequest: "Send request",
    submitBooking: "Book appointment",
    payBooking: "Pay booking fee",
    submitInquiry: "Check reference",
    paymentReviewTitle: "Review before payment",
    bookingFee: "Booking fee",
    paymentExpires: "Temporary slot hold ends at",
    cancellationPolicy: "The appointment is confirmed only after trusted payment confirmation from the provider. If payment fails or expires, choose a new time.",
    checkoutCreated: "Payment page is ready. You will be redirected to the secure hosted checkout.",
    paymentRetry: "Try payment again",
    paymentStatus: "Payment status",
    progressContact: "Contact",
    progressDetails: "Details",
    progressSlot: "Slot",
    progressPayment: "Payment",
    resumePaymentDraft: "We restored your previous details. You can choose a new time or edit the request without starting over.",
    whatsappFallback: "The request could not be completed more than once. You can contact the office directly and we will help with booking.",
    whatsappFallbackLabel: "Contact the office",
    nextStepsAfterBooking: "What happens next: the team reviews the request, then contacts you to confirm the appointment or request missing details.",
    preferredSlot: "Preferred appointment time",
    preferredSlotHint: "Optional. Office booking slots are reviewed by the team.",
    consent: "I agree to use this data to review the request and contact me. I understand this assistant does not provide legal advice.",
    successTitle: "Request saved",
    reference: "Reference",
    inquiryResult: "Verified booking details",
    noSlot: "No specific appointment time",
    requiredContact: "Name and phone are required before continuing.",
    requiredDetails: "Write a clear request summary of at least 20 characters.",
    requiredConsent: "Consent is required before sending the request.",
    fallbackError: "The request could not be completed. Review the details and try again.",
    requestId: "Request id",
    typing: "The assistant is checking the request",
    privacyNote: "Please do not share sensitive documents here. Our team will guide you securely.",
    trustTitle: "What happens next",
    trustItems: [
      { icon: "verified_user", label: "Human review", description: "The office team reviews the request before any legal decision." },
      { icon: "event_available", label: "Timing confirmation", description: "The team contacts you to confirm suitability and timing." },
      { icon: "lock", label: "Limited data", description: "Do not send documents in this public conversation." }
    ]
  },
  paymentReturn: {
    safeLinkNotice: "This link is showing a safe public payment status only. Client details and account links require the secure return link from the payment provider.",
    pending: "We have not received trusted payment confirmation yet.",
    countdown: "This page checks automatically while the temporary slot hold is active.",
    expired: "Expired",
    eyebrow: "Consultation booking payment status",
    missingStatusTitle: "Payment link is incomplete",
    missingStatusDescription: "Return to the booking page and start a new attempt.",
    labels: {
      attemptId: "Payment attempt",
      status: "Status",
      amount: "Amount",
      appointment: "Appointment",
      invoiceNumber: "Invoice number",
      temporaryHoldExpiresAt: "Temporary hold expires",
      clientName: "Client name",
      phone: "Phone number",
      paidAmount: "Paid amount",
      receiptNumber: "Receipt number",
      unavailable: "Unavailable"
    },
    actions: {
      pay: "Continue payment",
      receipt: "View / print invoice",
      accountSetup: "Create account and sign in",
      accountLogin: "Sign in",
      newBooking: "Book a new appointment"
    },
    paidConfirmation: {
      title: "Payment and appointment confirmed",
      description: "The payment invoice was created automatically and linked to the consultation booking.",
      badge: "Paid"
    },
    statusTones: {
      paid: {
        title: "Payment confirmed",
        description: "The consultation appointment was confirmed after a trusted payment notification from the provider."
      },
      failed: {
        title: "Payment could not be completed",
        description: "The appointment was not confirmed. You can return to booking and choose a new time or contact the office."
      },
      expired: {
        title: "Temporary hold expired",
        description: "The temporary appointment hold was released because trusted payment confirmation did not arrive in time."
      },
      pending: {
        title: "Waiting for payment provider confirmation",
        description: "The appointment is not confirmed from the return page. Confirmation appears only after a trusted payment notification arrives."
      },
      unknown: {
        title: "Payment status could not be read",
        description: "Check the link or start a new booking attempt."
      }
    }
  },
  clientAccountSetup: {
    metadataTitle: "Create Client Account | KMT Legal",
    eyebrow: "Client Portal",
    title: "Create your account to follow the consultation",
    description: "Use an email address and password you choose to access your consultation request, appointments, and related payments.",
    expiredTitle: "Account setup link is unavailable",
    expiredDescription: "The link may be expired or invalid. You can sign in if you already have an account, or contact the office with your reference number.",
    clientName: "Client name",
    consultationReference: "Reference",
    consultationSummary: "Request summary",
    appointmentTime: "Consultation time",
    emailLabel: "Email address",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm password",
    emailHint: "This email will be used to access the client portal.",
    passwordHint: "Use at least 10 characters.",
    submit: "Create account and sign in",
    existingAccountTitle: "This client already has an account",
    existingAccountDescription: "Use sign in to access the consultation from the client portal.",
    login: "Sign in",
    chatSetupPrompt: "You can now create an account to follow the consultation from the client portal.",
    chatExistingPrompt: "You can follow the consultation from the client portal using the existing account.",
    success: "Account created. You will be redirected to the client portal.",
    genericError: "The account could not be created. Review the details and try again.",
    passwordMismatch: "Passwords do not match.",
    invalidEmail: "Enter a valid email address.",
    weakPassword: "Password must be at least 10 characters."
  },
  privacyPage: {
    metadataTitle: "Privacy Policy | KMT Legal",
    metadataDescription: "How KMT Legal handles website, consultation, client, and job-applicant data, including applications submitted through Meta.",
    eyebrow: "Privacy notice",
    title: "Privacy Policy and Applicant Notice",
    description: "A clear account of the information KMT Legal receives, why it is used, who may access it, and how to exercise your privacy rights.",
    lastUpdatedLabel: "Last updated",
    lastUpdated: "2026-07-10",
    summaryTitle: "Key information",
    contentsLabel: "On this page",
    summaryItems: [
      { label: "Responsible entity", value: "KMT Legal" },
      { label: "Who this covers", value: "Website visitors, clients, consultation requesters, and job applicants" },
      { label: "Recruitment contact", value: "careers@kmtlegal.org" },
      { label: "General privacy contact", value: "contact@kmtlegal.com" }
    ],
    sections: [
      {
        id: "who-we-are",
        title: "1. Who is responsible for your data",
        paragraphs: [
          "KMT Legal is responsible for deciding how personal data covered by this notice is used. Recruitment questions and applicant privacy requests can be sent to the careers address below. General website and client privacy questions can be sent to the general contact address."
        ],
        bullets: [],
        links: [
          { label: "careers@kmtlegal.org", href: "mailto:careers@kmtlegal.org" },
          { label: "contact@kmtlegal.com", href: "mailto:contact@kmtlegal.com" }
        ]
      },
      {
        id: "scope",
        title: "2. Scope of this notice",
        paragraphs: [
          "This notice covers job applications submitted through a Meta Instant Form and CVs sent by email. It also covers personal data submitted through KMT Legal website contact and consultation services, client accounts, protected document services, and the limited technical data needed to operate those services.",
          "Meta processes information on Facebook and Instagram under its own terms and privacy policy. This notice explains KMT Legal's use after information is submitted or made available to the office."
        ],
        bullets: [],
        links: []
      },
      {
        id: "data-we-collect",
        title: "3. Personal data we collect",
        paragraphs: [
          "For the Executive Legal Coordinator recruitment campaign, KMT Legal receives the information you choose to submit in the Meta form and the CV you send by email. A CV may contain additional education, employment, language, and professional information that you decide to provide.",
          "Website contact and consultation services may also receive contact details, a city, a message or matter summary, preferred contact or meeting details, account information, and documents submitted later through protected channels."
        ],
        bullets: [
          "Full name, phone number, and email address.",
          "Law degree or legal-education status.",
          "English-language and Microsoft Office proficiency.",
          "Legal or administrative experience.",
          "Ability to work on site in the New Administrative Capital.",
          "Availability to start work.",
          "CV content and correspondence about the application."
        ],
        links: []
      },
      {
        id: "sources",
        title: "4. Where the data comes from",
        paragraphs: [
          "We receive data directly from you, from the Meta Instant Form you submit on Facebook or Instagram, from emails and attachments you send to KMT Legal, and from forms or protected services you choose to use on this website."
        ],
        bullets: [],
        links: []
      },
      {
        id: "purposes-and-basis",
        title: "5. Why we use the data and the basis for use",
        paragraphs: [
          "Applicant data is used to review suitability for the advertised role, verify the information relevant to that review, arrange interviews or assessments, communicate about the application, and keep the records needed to manage the recruitment process.",
          "Website and client data is used to respond to messages, review consultation requests, organize appointments, operate client accounts, protect the service, and comply with applicable obligations. We process information you choose to submit to take the requested steps, and we request separate consent where consent is required for a distinct purpose.",
          "Applicant data is not used to market legal services unless the person gives separate, explicit consent for that purpose."
        ],
        bullets: [],
        links: []
      },
      {
        id: "access-and-sharing",
        title: "6. Who may access the data",
        paragraphs: [
          "Access inside KMT Legal is limited to authorized people who need the information for recruitment, legal-service intake, client support, administration, security, or technical operation.",
          "Data may be handled by service providers necessary to deliver the relevant channel, such as Meta for the Instant Form and the email, hosting, database, or protected-storage services used by KMT Legal. They may use the data only for the service or purpose for which it was provided, subject to applicable requirements.",
          "KMT Legal does not sell applicant or client personal data."
        ],
        bullets: [],
        links: []
      },
      {
        id: "meta-and-transfers",
        title: "7. Meta and processing outside Egypt",
        paragraphs: [
          "Meta receives and processes information when you use Facebook, Instagram, or an Instant Form. Because Meta operates globally, its processing or storage may take place outside Egypt according to Meta's own privacy policy.",
          "KMT Legal will make any other international transfer only where it is necessary for the relevant service and subject to the requirements that apply to that transfer."
        ],
        bullets: [],
        links: [
          { label: "Meta Privacy Policy", href: "https://www.facebook.com/privacy/policy/" },
          { label: "Meta Lead Ad Terms", href: "https://www.facebook.com/ads/leadgen/tos" }
        ]
      },
      {
        id: "retention",
        title: "8. How long we keep data",
        paragraphs: [
          "We keep personal data only for as long as it is needed for the purpose described in this notice, to complete the relevant recruitment or service process, and for any reasonable follow-up, dispute, security, or legal requirement that applies.",
          "An unsuccessful application is not kept for unrelated future vacancies unless the applicant separately agrees. When data is no longer needed, it is deleted or securely disposed of, subject to any lawful need to retain a limited record and the practical deletion cycle of protected backups."
        ],
        bullets: [],
        links: []
      },
      {
        id: "security",
        title: "9. How we protect data",
        paragraphs: [
          "KMT Legal uses organizational and technical measures appropriate to the data and service, including limited access, protected accounts and sessions, validation, private document storage, and privacy-aware logging. No online or email system can guarantee absolute security, so please use the designated channels and avoid sending unnecessary sensitive information."
        ],
        bullets: [],
        links: []
      },
      {
        id: "rights",
        title: "10. Your choices and privacy rights",
        paragraphs: [
          "Subject to applicable law, you may ask whether KMT Legal holds personal data about you and request access, correction, or deletion. You may also withdraw consent where processing depends on consent, object or request a restriction where the law provides for it, and raise a complaint.",
          "Send enough information to identify the relevant application or request, but do not email passwords, national identification numbers, or financial data. We may need to verify identity before acting and may retain information where a legal exception or obligation applies."
        ],
        bullets: [],
        links: [
          { label: "Applicant privacy request", href: "mailto:careers@kmtlegal.org?subject=Applicant%20privacy%20request" },
          { label: "Personal Data Protection Center", href: "https://pdpc.gov.eg" }
        ]
      },
      {
        id: "minors-and-minimization",
        title: "11. Minors and unnecessary sensitive data",
        paragraphs: [
          "The advertised professional role and its Meta campaign are not directed to minors. Do not submit a national identification number, financial details, health data, or other sensitive information that is not necessary for the recruitment process. If additional information is lawfully required at a later stage, KMT Legal will request it through an appropriate channel."
        ],
        bullets: [],
        links: []
      },
      {
        id: "cookies-and-analytics",
        title: "12. Cookies and analytics",
        paragraphs: [
          "The public privacy page and recruitment notice do not require login. The platform uses a necessary session cookie after sign-in and first-party operational analytics for limited events. Those analytics are designed not to include names, email addresses, phone numbers, addresses, legal summaries, document contents, or file names.",
          "The repository does not include a marketing pixel or advertising-cookie integration for the public website. Meta's own cookies and tracking on Facebook and Instagram are governed by Meta's policies."
        ],
        bullets: [],
        links: []
      },
      {
        id: "changes",
        title: "13. Changes to this notice",
        paragraphs: [
          "We may update this notice when the services, recruitment process, providers, or applicable requirements change. The current version and its latest update date will remain available on this page. Material changes will be communicated through an appropriate channel when required."
        ],
        bullets: [],
        links: []
      }
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
    categories: {
      "legal-consultation": "Consultations by area",
      "corporate-business-services": "Companies & commercial contracts",
      "real-estate-legal-support": "Real estate legal review",
      "claims-collections": "Debt claims & settlement"
    },
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
    manualReviewNotice: "This request will be sent for office review only. No booking fee is shown here, and no appointment is confirmed automatically before the office contacts you.",
    manualReviewSaved: "The request was saved for office review. The office will contact you after reviewing the details and confirming the suitable next step.",
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
