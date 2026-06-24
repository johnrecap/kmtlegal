"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select } from "@/components/ui";

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

export function DocumentUploadForm({ cases }: { cases: CaseOption[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    <Card>
      <CardHeader>
        <CardTitle>رفع مستند</CardTitle>
        <CardDescription>الحد الأقصى 5MB. الأنواع المسموحة: PDF, DOC, DOCX, JPG, PNG.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={upload}>
          <Select label="ربط المستند بقضية" name="caseId">
            <option value="">بدون قضية محددة</option>
            {cases.map((legalCase) => (
              <option key={legalCase.id} value={legalCase.id}>
                {legalCase.internalFileNumber} - {legalCase.title}
              </option>
            ))}
          </Select>
          <Select defaultValue="OTHER" label="تصنيف المستند" name="category">
            <option value="CONTRACT">عقد</option>
            <option value="COURT_FILE">ملف محكمة</option>
            <option value="IDENTITY">هوية</option>
            <option value="EVIDENCE">دليل</option>
            <option value="PAYMENT">دفع</option>
            <option value="OTHER">أخرى</option>
          </Select>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-kmt-ink" htmlFor="portal-document-file">
              الملف
            </label>
            <input
              id="portal-document-file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm"
              name="file"
              required
              type="file"
            />
          </div>
          <Button loading={isUploading} type="submit">
            رفع المستند
          </Button>
          {message ? (
            <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-900" role="status">
              {message}
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
