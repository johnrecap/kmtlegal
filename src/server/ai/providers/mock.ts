import type { AIProviderAdapter, AITask } from "../types";

const REVIEW_NOTE = "مسودة تنظيمية فقط؛ يجب أن يراجعها محام قبل الاعتماد.";

export function createMockAIProvider(): AIProviderAdapter {
  return {
    name: "mock",
    async generate(input) {
      return {
        provider: "mock",
        model: "mock-kmt-legal-v1",
        task: input.task,
        output: mockOutputForTask(input.task),
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0
        }
      };
    }
  };
}

function mockOutputForTask(task: AITask) {
  switch (task) {
    case "consultation_classification":
      return {
        category: "corporate",
        urgency: "normal",
        confidence: 0.82,
        reasons: ["تصنيف تجريبي مبني على حقول طلب الاستشارة المنظمة."],
        reviewNote: REVIEW_NOTE
      };
    case "consultation_assistant":
      return {
        action: "answer_general",
        message: "أقدر أساعدك في حجز موعد استشارة أو الاستعلام عن موعد استشارة برقم المرجع بعد التحقق من الهاتف أو البريد.",
        missingFields: [],
        serviceCategory: null,
        urgency: "NORMAL",
        preferredMode: "ONLINE",
        startsAt: null,
        reviewNote: REVIEW_NOTE
      };
    case "intake_summary":
      return {
        summary: "تم استلام طلب قانوني منظم يحتاج إلى مراجعة فريق المكتب قبل التواصل.",
        keyFacts: ["أرسل العميل طلبًا قانونيًا عبر نموذج الاستشارة.", "مراجعة الفريق مطلوبة قبل تقديم أي توجيه."],
        missingInfo: ["المستندات ذات الصلة", "الموعد المفضل للتواصل"],
        reviewNote: REVIEW_NOTE
      };
    case "document_checklist_suggestion":
      return {
        items: [
          { label: "إثبات هوية العميل", reason: "مطلوب للتحقق من ملف العميل." },
          { label: "العقد أو الإخطار ذي الصلة", reason: "مطلوب لفهم سياق الطلب أو النزاع." }
        ],
        reviewNote: REVIEW_NOTE
      };
    case "anonymous_case_study_draft":
      return {
        title: "مسودة دراسة حالة مجهولة",
        draft: "مسودة توعوية آمنة للخصوصية يجب مراجعتها وإخفاء أي تفاصيل تعريفية قبل النشر.",
        anonymizationChecklist: ["حذف الأسماء", "حذف التواريخ التي قد تكشف الأطراف", "حذف معرفات الطرف المقابل"],
        reviewNote: REVIEW_NOTE
      };
    case "social_post_draft":
      return {
        platform: "linkedin",
        content: "مسودة توعية قانونية للمراجعة قبل النشر.",
        hashtags: ["#توعية_قانونية", "#KMTLegal"],
        reviewNote: REVIEW_NOTE
      };
  }
}
