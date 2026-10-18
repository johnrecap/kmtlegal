export const legalAssistantCopy = {
  ar: {
    sources: "المصادر الرسمية", accessed: "تاريخ الاطلاع", draft: "مسودة أولية للمراجعة قبل الاعتماد",
    assumed: "سأجيب وفق القانون المصري ما لم تحدد دولة أخرى.", jurisdiction: "القانون المعني: {country}.",
    conflict: "القانون المطلوب تطبيقه على سؤالك يخص أي دولة؟",
    unverified: "تعذر التحقق من مصادر رسمية كافية الآن؛ الشرح التالي عام، ولا يؤكد نصًا أو تعديلًا أو ميعادًا قانونيًا حاليًا.",
    fallback: "التفاصيل المتاحة لا تكفي لإجابة قانونية موثوقة عن النقطة دي. ما أهم واقعة أو بند تريد توضيحه؟",
    unavailable: "تعذر تجهيز الشرح القانوني الآن. سؤالك محفوظ ويمكنك إعادة المحاولة.",
    review: "التحليل مبني على الوقائع المذكورة والافتراضات الموضحة، ويحتاج مراجعة مختص قبل اتخاذ قرار أو اعتماد مسودة.",
    booking: "يمكنك طلب استشارة من خلال الحجز داخل الموقع.",
    outside: "أقدر أساعدك في الاستفسارات القانونية، وخدمات KMT Legal والحجز ومتابعة طلباتك."
  },
  en: {
    sources: "Official sources", accessed: "Accessed", draft: "Preliminary draft for review before use",
    assumed: "I will use Egyptian law unless you specify another jurisdiction.", jurisdiction: "Applicable jurisdiction: {country}.",
    conflict: "Which country's law should apply to your question?",
    unverified: "Sufficient official sources could not be verified now. The following explanation is general and does not confirm a current provision, amendment or legal deadline.",
    fallback: "The available details do not support a reliable legal answer to this point. Which key fact or clause would you like clarified?",
    unavailable: "The legal explanation could not be prepared now. Your question is saved and you can try again.",
    review: "This analysis depends on the stated facts and assumptions and needs professional review before a decision or draft is relied on.",
    booking: "You can request a consultation through booking on this website.",
    outside: "I can help with legal questions, KMT Legal services, bookings and your own requests."
  }
} as const;
