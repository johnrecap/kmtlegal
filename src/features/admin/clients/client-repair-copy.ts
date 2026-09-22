export const clientRepairCopy = {
  viewAll: "عرض الكل",
  upcomingAppointments: "المواعيد القادمة",
  appointmentHistory: "سجل المواعيد",
  documents: "المستندات",
  documentPreview: (shown: number, total: number) => `يعرض ${shown} من ${total} مستندات متاحة ضمن صلاحياتك.`,
  noDocumentsTitle: "لا توجد مستندات",
  noDocuments: "لا توجد مستندات متاحة مرتبطة بهذا العميل.",
  noUpcomingAppointments: "لا توجد مواعيد قادمة مرتبطة بهذا العميل.",
  noAppointmentHistory: "لا توجد مواعيد سابقة مرتبطة بهذا العميل."
} as const;
