export const BOOKING_SUMMARY_MIN_LENGTH = 20;

/** Server-rendered intake copy. Never use model prose as a follow-up question. */
export const bookingAssistantCopy = {
  ar: {
    questions: {
      fullName: "ما اسمك الكامل لإضافته إلى طلب الاستشارة؟",
      phone: "ما رقم الهاتف المناسب لتواصل المكتب معك؟",
      serviceCategory: "اختر المجال الأقرب لطلبك، أو استشارة عامة إذا لم تكن متأكدًا.",
      summary: `اكتب وصفًا مختصرًا للمشكلة، ${BOOKING_SUMMARY_MIN_LENGTH} حرفًا على الأقل، بدون مستندات أو تفاصيل حساسة.`,
      startsAt: "اختر موعدًا مناسبًا من المواعيد المتاحة داخل المحادثة.",
      fallback: "أقدر أساعدك في حجز استشارة. ما الذي تحتاج إلى مراجعته مع المكتب؟"
    },
    retry: "لم تتضح الإجابة بعد. البيانات السابقة محفوظة في هذه المحادثة.",
    legalBoundary: "تقييم الموقف يحتاج مراجعة محامٍ. أقدر أكمل معك حجز الاستشارة.",
    categorySuggestion: "الوصف قد يكون أقرب إلى استشارة عامة. يمكنك تغيير المجال أو الاحتفاظ باختيارك ليراجعه الفريق."
  },
  en: {
    questions: {
      fullName: "What is your full name for the consultation request?",
      phone: "What phone number should the office use to contact you?",
      serviceCategory: "Choose the closest area, or a general consultation if you are unsure.",
      summary: `Briefly describe the matter in at least ${BOOKING_SUMMARY_MIN_LENGTH} characters, without documents or sensitive details.`,
      startsAt: "Choose a suitable time from the available slots in the conversation.",
      fallback: "I can help book a consultation. What would you like the office to review?"
    },
    retry: "That answer is not clear yet. Your previous details are still available in this conversation.",
    legalBoundary: "A lawyer needs to review the matter. I can continue helping you book the consultation.",
    categorySuggestion: "This description may fit a general consultation better. You can change the area or keep your selection for the team to review."
  }
} as const;
