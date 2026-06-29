"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ClientPortalPanel, clientPortalPrimaryActionClass } from "@/components/layout";
import { ClientPortalSelect, type ClientPortalSelectOption } from "@/components/layout/client-portal-select";
import { Button } from "@/components/ui";
import { documentCategoryLabels, labelFrom } from "@/lib/legal-format";

type CaseOption = {
  id: string;
  title: string;
  internalFileNumber: string;
};

type ApiErrorBody = {
  error?: {
    message?: string;
  };
};

const documentCategoryValues = ["CONTRACT", "COURT_FILE", "IDENTITY", "EVIDENCE", "PAYMENT", "OTHER"] as const;

const documentCategoryOptions: ClientPortalSelectOption[] = documentCategoryValues.map((category) => ({
  value: category,
  label: labelFrom(documentCategoryLabels, category)
}));

export function DocumentUploadForm({ cases }: { cases: CaseOption[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const caseOptions: ClientPortalSelectOption[] = [
    { value: "", label: "بدون قضية محددة" },
    ...cases.map((legalCase) => ({
      value: legalCase.id,
      label: `${legalCase.internalFileNumber} - ${legalCase.title}`
    }))
  ];

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsUploading(true);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      formData.set("visibility", "CLIENT_VISIBLE");
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
        setMessage(body.error?.message ?? "تعذر رفع المستند.");
        return;
      }

      form.reset();
      setMessage("تم رفع المستند بنجاح.");
      router.refresh();
    } catch {
      setMessage("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <ClientPortalPanel description="الحد الأقصى 5MB. الأنواع المسموحة: PDF, DOC, DOCX, JPG, PNG." title="رفع مستند جديد">
      <form className="space-y-4" onSubmit={upload}>
        <ClientPortalSelect label="ربط المستند بقضية" name="caseId" options={caseOptions} />
        <ClientPortalSelect defaultValue="OTHER" label="تصنيف المستند" name="category" options={documentCategoryOptions} />
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-white" htmlFor="portal-document-file">
            الملف
          </label>
          <input
            id="portal-document-file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
            className="client-portal-file-input w-full rounded border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-slate-100 file:me-3 file:rounded file:border-0 file:bg-kmt-gold file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#120d07] hover:border-kmt-gold/50 focus:border-kmt-gold focus:ring-2 focus:ring-kmt-gold/20"
            name="file"
            required
            type="file"
          />
        </div>
        <Button className={clientPortalPrimaryActionClass} loading={isUploading} type="submit">
          رفع المستند
        </Button>
        {message ? (
          <div className="rounded border border-blue-300/35 bg-blue-950/45 px-3 py-2 text-sm leading-6 text-blue-100" role="status">
            {message}
          </div>
        ) : null}
      </form>
    </ClientPortalPanel>
  );
}
