export const assistantActionCopy = {
  ar: {
    officeReview: "لإرسال رسالة للمكتب، اختر «المكتب» ثم راجع رسالتك واضغط إرسال. لم أرسل المحادثة تلقائيًا.",
    days: "يوم", answers: { YES: "نعم", NO: "لا", UNSURE: "غير متأكد", NOT_APPLICABLE: "لا ينطبق" },
    pending: "جهّزت الاقتراح. راجع التفاصيل ثم اضغط تأكيد لتنفيذه.", confirm: "تأكيد التنفيذ", cancel: "إلغاء الاقتراح", completed: "تم تنفيذ الإجراء.", cancelled: "أُلغي الاقتراح.", stale: "تغيّرت البيانات أو انتهت صلاحية الاقتراح. اطلب اقتراحًا جديدًا.", disabled: "يمكنك تنفيذ هذا التغيير من صفحة حسابك؛ إجراءات المساعد غير مفعلة لحسابك حاليًا.", choose: "حدد الطلب المقصود أولًا من طلباتك، ثم اطلب التغيير.",
    kinds: { PROFILE: "تعديل بيانات الاتصال", PREFERENCE: "تغيير اللغة", SERVICE_CREATE: "إنشاء طلب خدمة", SERVICE: "تعديل طلب الخدمة", OFFICE_MESSAGE: "إرسال رسالة للمكتب", ALTERNATIVE_TIME: "طلب موعد بديل للمراجعة", BOOKING: "تغيير الحجز" },
    bookings: { confirm_booking: "تأكيد الحجز", reschedule_booking: "تعديل الموعد", cancel_booking: "إلغاء الحجز", request_callback: "طلب اتصال من المكتب" },
    fields: { fullName: "الاسم", phone: "الهاتف", email: "بريد الاتصال", city: "المدينة", locale: "اللغة", reference: "الطلب", operation: "الإجراء", quote: "العرض المعتمد للتأكيد", intake: "بيانات الطلب", message: "الرسالة", service: "الخدمة" },
    operations: { save: "حفظ البيانات", submit: "إرسال الطلب للمكتب", accept: "قبول العرض", changes: "طلب تعديل", cancel: "إلغاء الطلب", message: "إرسال رسالة" },
    services: { CONTRACT_DRAFT: "صياغة عقد", CONTRACT_REVIEW: "مراجعة عقد", HEALTH_CHECK: "فحص قانوني" }
  },
  en: {
    officeReview: "To message the office, select Office, review your message and press Send. I have not forwarded this conversation automatically.",
    days: "days", answers: { YES: "Yes", NO: "No", UNSURE: "Unsure", NOT_APPLICABLE: "Not applicable" },
    pending: "Your proposal is ready. Review the details, then confirm to execute it.", confirm: "Confirm action", cancel: "Cancel proposal", completed: "Action completed.", cancelled: "Proposal cancelled.", stale: "The record changed or this proposal expired. Request a new proposal.", disabled: "Use your account page for this change; assistant actions are not enabled for your account yet.", choose: "Select the intended request from your requests first, then ask for the change.",
    kinds: { PROFILE: "Update contact details", PREFERENCE: "Change language", SERVICE_CREATE: "Create service request", SERVICE: "Update service request", OFFICE_MESSAGE: "Send a message to the office", ALTERNATIVE_TIME: "Request an alternative time for review", BOOKING: "Change booking" },
    bookings: { confirm_booking: "Confirm booking", reschedule_booking: "Reschedule appointment", cancel_booking: "Cancel booking", request_callback: "Request an office callback" },
    fields: { fullName: "Name", phone: "Phone", email: "Contact email", city: "City", locale: "Language", reference: "Request", operation: "Action", quote: "Offer to accept", intake: "Request details", message: "Message", service: "Service" },
    operations: { save: "Save details", submit: "Submit to office", accept: "Accept offer", changes: "Request changes", cancel: "Cancel request", message: "Send message" },
    services: { CONTRACT_DRAFT: "Contract drafting", CONTRACT_REVIEW: "Contract review", HEALTH_CHECK: "Legal health check" }
  }
} as const;
