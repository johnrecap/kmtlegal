import type { PublicLocale } from "@/lib/public-locale";

export const uiPreviewCopy = {
  en: {
    label: "Design preview · sample interactions only",
    skip: "Skip to preview content",
    navigationLabel: "Preview navigation",
    switchLanguage: "العربية",
    navigation: { home: "Home", service: "Service detail", booking: "Request a consultation" },
    home: { serviceEyebrow: "A considered starting point", processEyebrow: "A clear first exchange", peopleEyebrow: "Defined expertise", sectorsEyebrow: "Sectors we support", serviceTitle: "Start with the matter, not a generic category.", processTitle: "Organize the facts before the office reviews the file.", peopleTitle: "People behind the practice areas.", sectorsTitle: "Practice support shaped around the work." },
    service: { eyebrow: "Service detail", included: "Scope shown for initial review", next: "Request a consultation", back: "Explore another service", documents: "Documents may help the review", documentsNote: "The office confirms what is needed after reading the facts. This preview does not create a document requirement." },
    booking: { eyebrow: "Consultation request", title: "Make the first request clear.", lead: "This interactive preview uses sample availability only. Nothing is sent to KMT Legal.", summary: "Request summary", edit: "Edit", openSummary: "Review request", close: "Close", service: "Matter area", method: "Meeting preference", details: "Brief context", detailsHint: "Share the main fact, date, or requested action. Do not add documents or sensitive data.", slot: "Sample appointment window", chooseSlot: "Choose a sample time", confirm: "Confirm demo request", conflict: "Simulate unavailable time", retry: "Try another sample time", confirmed: "Demo request ready for review", confirmation: "This is a simulated result. No request, appointment, payment, or reference has been created.", conflictMessage: "That sample time is no longer available in this preview. Choose another visible time.", empty: "Choose a matter area and a sample time to review the request.", online: "Online", phone: "Phone", office: "Office visit", sample: "Sample data", noNetwork: "No booking, payment, or provider request is made from this preview." },
    footer: "This preview keeps sample interactions separate from the live legal platform."
  },
  ar: {
    label: "معاينة تصميم · تفاعلات نموذجية فقط",
    skip: "انتقل إلى محتوى المعاينة",
    navigationLabel: "تنقل المعاينة",
    switchLanguage: "English",
    navigation: { home: "الرئيسية", service: "تفاصيل الخدمة", booking: "طلب استشارة" },
    home: { serviceEyebrow: "بداية مدروسة", processEyebrow: "تواصل أول واضح", peopleEyebrow: "خبرات محددة", sectorsEyebrow: "قطاعات ندعمها", serviceTitle: "ابدأ من طبيعة المسألة، لا من تصنيف عام.", processTitle: "رتّب الوقائع قبل أن يراجع المكتب الملف.", peopleTitle: "الفريق خلف مجالات الممارسة.", sectorsTitle: "دعم قانوني يتشكل حول طبيعة العمل." },
    service: { eyebrow: "تفاصيل الخدمة", included: "النطاق المعروض للمراجعة الأولية", next: "طلب استشارة", back: "استكشف خدمة أخرى", documents: "قد تساعد مستندات في المراجعة", documentsNote: "يحدد المكتب ما يلزم بعد قراءة الوقائع. هذه المعاينة لا تضع متطلبات مستندات." },
    booking: { eyebrow: "طلب استشارة", title: "اجعل الطلب الأول واضحًا.", lead: "تستخدم هذه المعاينة مواعيد نموذجية فقط. لا يتم إرسال أي شيء إلى KMT Legal.", summary: "ملخص الطلب", edit: "تعديل", openSummary: "مراجعة الطلب", close: "إغلاق", service: "مجال المسألة", method: "طريقة الاجتماع", details: "سياق مختصر", detailsHint: "اكتب الواقعة الأساسية أو التاريخ أو الإجراء المطلوب. لا تضف مستندات أو بيانات حساسة.", slot: "نافذة موعد نموذجية", chooseSlot: "اختر وقتًا نموذجيًا", confirm: "تأكيد الطلب التجريبي", conflict: "محاكاة عدم توفر الوقت", retry: "اختر وقتًا نموذجيًا آخر", confirmed: "الطلب التجريبي جاهز للمراجعة", confirmation: "هذه نتيجة تجريبية. لم يُنشأ طلب أو موعد أو دفع أو رقم مرجعي.", conflictMessage: "هذا الوقت النموذجي لم يعد متاحًا داخل المعاينة. اختر وقتًا ظاهرًا آخر.", empty: "اختر مجال المسألة ووقتًا نموذجيًا لمراجعة الطلب.", online: "عبر الإنترنت", phone: "هاتف", office: "زيارة المكتب", sample: "بيانات نموذجية", noNetwork: "لا تُرسل هذه المعاينة طلب حجز أو دفع أو مزود خدمة." },
    footer: "تحافظ هذه المعاينة على التفاعلات النموذجية منفصلة عن المنصة القانونية الفعلية."
  }
} as const;

export function getUiPreviewCopy(locale: PublicLocale) {
  return uiPreviewCopy[locale];
}
