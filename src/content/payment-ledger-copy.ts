export const paymentLedgerCopy = {
  ar: {
    uploadProof: "رفع إثبات تحويل", proofSaved: "وصل إثبات التحويل وينتظر مراجعة المكتب؛ لم تتغير حالة السداد.", proofFailed: "تعذر رفع الملف. الحد الأقصى 5 ميجابايت، وقد يكون فحص الملفات غير متاح مؤقتًا.",
    title: "الأتعاب والدفعات", total: "قيمة المطالبة", paid: "صافي المدفوع", remaining: "المتبقي", entries: "سجل الدفعات والتصحيحات", empty: "لا توجد دفعات معتمدة لهذه المطالبة.",
    add: "تسجيل دفعة أو تصحيح", kind: "نوع القيد", amount: "المبلغ", method: "طريقة الدفع", receipt: "رقم الإيصال أو مرجع التحويل", occurredAt: "تاريخ الدفع", reason: "سبب الاسترداد أو التصحيح", original: "القيد المراد عكسه", save: "اعتماد القيد", saved: "تم تسجيل القيد وتحديث الرصيد.", failed: "تعذر تسجيل القيد. راجع المبلغ والعملة والرصيد ورقم الإيصال، ثم حاول مرة أخرى.", review: "هذه المطالبة تحتاج إلى مراجعة مالية؛ لا تعتبر حالة الدفع القديمة وحدها إثباتًا للتسوية.",
    proof: "إثبات التحويل لا يصبح دفعة معتمدة إلا بعد مراجعة المكتب.", kinds: { SETTLEMENT: "دفعة", REFUND: "استرداد", REVERSAL: "عكس قيد للتصحيح", LEGACY: "دفعة سابقة مرحّلة" }, methods: { CASH: "نقدًا", BANK_TRANSFER: "تحويل بنكي" }
  },
  en: {
    uploadProof: "Upload transfer evidence", proofSaved: "Your evidence was received for office review; payment status has not changed.", proofFailed: "The file could not be uploaded. The limit is 5 MB; security scanning may be temporarily unavailable.",
    title: "Fees and payments", total: "Invoice total", paid: "Net paid", remaining: "Remaining", entries: "Payments and corrections", empty: "No approved payments for this invoice.",
    add: "Record a payment or correction", kind: "Entry type", amount: "Amount", method: "Payment method", receipt: "Receipt or transfer reference", occurredAt: "Payment date", reason: "Refund or correction reason", original: "Entry to reverse", save: "Approve entry", saved: "Entry recorded and balance updated.", failed: "Could not record this entry. Check the amount, currency, balance and receipt reference, then retry.", review: "This invoice needs financial reconciliation; its historical status alone does not prove settlement.",
    proof: "A transfer receipt becomes an approved payment only after office review.", kinds: { SETTLEMENT: "Payment", REFUND: "Refund", REVERSAL: "Correction reversal", LEGACY: "Imported historical payment" }, methods: { CASH: "Cash", BANK_TRANSFER: "Bank transfer" }
  }
} as const;
