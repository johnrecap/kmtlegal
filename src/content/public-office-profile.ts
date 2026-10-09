/** Owner-approved public contacts. Do not override these with legacy environment URLs. */
export const publicOfficeProfile = {
  phoneDisplay: "01117416666",
  phoneHref: "tel:+201117416666",
  whatsappHref: "https://wa.me/201117416666",
  email: "contact@kmtlegal.org",
  emailHref: "mailto:contact@kmtlegal.org",
  applicantPrivacyHref: "mailto:contact@kmtlegal.org?subject=Applicant%20privacy%20request",
  address: {
    ar: "العاصمة الإدارية الجديدة، مصر",
    en: "New Administrative Capital, Egypt"
  }
} as const;

// Exact address, map pin, official social URLs, team credentials and office photos
// remain pending owner input. Never substitute guessed links or stock-photo claims.
