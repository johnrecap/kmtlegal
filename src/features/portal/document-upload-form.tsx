"use client";

import { useHydrated } from "@/lib/use-hydrated";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ClientPortalPanel, clientPortalPrimaryActionClass } from "@/components/layout";
import { ClientPortalSelect, type ClientPortalSelectOption } from "@/components/layout/client-portal-select";
import { Button } from "@/components/ui";
import { FileUpload } from "@/components/ui/file-upload";
import {
  clientErrorMessage,
  getClientContent,
  type ClientLocale
} from "@/content/client-content";

type CaseOption = {
  id: string;
  title: string;
  internalFileNumber: string;
};

type ApiErrorBody = {
  error?: {
    code?: string;
  };
  requestId?: string;
};

const documentCategoryValues = ["CONTRACT", "COURT_FILE", "IDENTITY", "EVIDENCE", "PAYMENT", "OTHER"] as const;

const documentAccept =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png";

export function DocumentUploadForm({ cases, locale }: { cases: CaseOption[]; locale: ClientLocale }) {
  const router = useRouter();
  const isHydrated = useHydrated();
  const copy = getClientContent(locale);
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const documentCategoryOptions: ClientPortalSelectOption[] = documentCategoryValues.map((category) => ({
    value: category,
    label: copy.statuses.documentCategory[category]
  }));
  const caseOptions: ClientPortalSelectOption[] = [
    { value: "", label: copy.upload.noCase },
    ...cases.map((legalCase) => ({
      value: legalCase.id,
      label: `${legalCase.internalFileNumber} - ${legalCase.title}`
    }))
  ];

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      return;
    }
    setMessage(null);
    setIsUploading(true);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      // The File Upload dropzone owns file selection outside the form data,
      // so the verified single file is attached under the same `file` field
      // name and payload semantics as the previous native input.
      formData.set("file", selectedFile, selectedFile.name);
      formData.set("visibility", "CLIENT_VISIBLE");
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
        setMessage(clientErrorMessage(locale, body.error?.code, copy.upload.failed));
        return;
      }

      form.reset();
      setSelectedFile(null);
      setUploadKey((key) => key + 1);
      setMessage(copy.upload.succeeded);
      router.refresh();
    } catch {
      setMessage(copy.upload.networkError);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <ClientPortalPanel description={copy.upload.description} title={copy.upload.title}>
      <form className="space-y-4" method="post" onSubmit={upload}>
        <ClientPortalSelect disabled={!isHydrated || isUploading} label={copy.upload.caseLabel} name="caseId" options={caseOptions} />
        <ClientPortalSelect disabled={!isHydrated || isUploading} defaultValue="OTHER" label={copy.upload.categoryLabel} name="category" options={documentCategoryOptions} />
        <div className="space-y-2" data-testid="portal-document-dropzone">
          <span className="block text-sm font-semibold text-[var(--kmt-client-text)]">
            {copy.upload.fileLabel}
          </span>
          <div className="rounded-lg border border-[var(--kmt-client-line)] bg-[var(--kmt-client-surface)] px-2 py-2">
            <FileUpload
              key={uploadKey}
              accept={documentAccept}
              onChange={(files) => setSelectedFile(files[files.length - 1] ?? null)}
            />
          </div>
          <p className="text-xs leading-6 text-[var(--kmt-client-muted)]">
            {selectedFile ? `${selectedFile.name} · ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : copy.upload.description}
          </p>
        </div>
        <Button disabled={!isHydrated || isUploading || !selectedFile} className={clientPortalPrimaryActionClass} loading={isUploading} type="submit">
          {copy.upload.submit}
        </Button>
        {message ? (
          <div className="rounded border border-[var(--kmt-state-info-border)] bg-[var(--kmt-state-info-surface)] px-3 py-2 text-sm leading-6 text-[var(--kmt-state-info)]" role="status">
            {message}
          </div>
        ) : null}
      </form>
    </ClientPortalPanel>
  );
}
