export const taskRepairCopy = {
  readOnly: "قراءة فقط",
  loadMore: "تحميل المزيد",
  loadingMore: "جارٍ تحميل المزيد…",
  loadMoreFailed: "تعذر تحميل المزيد من المهام. حاول مرة أخرى.",
  noTasksInColumn: "لا توجد مهام هنا.",
  noTaskAccessTitle: "عرض المهام غير متاح",
  noTaskAccessDescription: "هذا التبويب يحتاج صلاحية قراءة المهام داخل نطاق حسابك.",
  noDocumentAccessTitle: "عرض المستندات غير متاح",
  noDocumentAccessDescription: "هذا التبويب يحتاج صلاحية قراءة المستندات داخل نطاق حسابك.",
  editTaskAria: (title: string) => `تعديل المهمة ${title}`
} as const;
