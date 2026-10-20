/** Owner-approved public contacts. Do not override these with legacy environment URLs. */
export const publicOfficeProfile = {
  phoneDisplay: "01117416666",
  phoneHref: "tel:+201117416666",
  whatsappHref: "https://wa.me/201117416666",
  email: "contact@kmtlegal.org",
  emailHref: "mailto:contact@kmtlegal.org",
  applicantPrivacyHref: "mailto:contact@kmtlegal.org?subject=Applicant%20privacy%20request",
  mapHref: "https://maps.app.goo.gl/muoNe1hNgw2QNWtb9",
  address: {
    ar: "العاصمة الإدارية الجديدة، طريق الأمل، مول جولدن تاور، الدور الثاني، مكتب ٢٠١",
    en: "New Administrative Capital, Al Amal Road, Golden Tower Mall, Second Floor, Office 201"
  }
} as const;

// Address and map were supplied by the owner. Official social URLs and team
// credentials remain pending owner input; never substitute guessed facts.
