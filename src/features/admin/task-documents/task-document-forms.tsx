"use client";

import { useHydrated } from "@/lib/use-hydrated";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Button, InlineFeedback, Select, StateBlock, TextInput, Textarea } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { FileUpload } from "@/components/ui/file-upload";
import { AdminDialog } from "@/components/admin/admin-dialog";
import {
  documentCategoryLabels,
  documentStatusLabels,
  documentVisibilityLabels,
  labelFrom,
  taskPriorityLabels,
  taskStatusLabels
} from "@/lib/legal-format";
import { plan35TaskUiCopy } from "@/lib/ui-copy";

type AssigneeOption = {
  id: string;
  name: string;
  email?: string | null;
};

type CaseOption = {
  id: string;
  internalFileNumber: string;
  title: string;
  client?: {
    id: string;
    fullName: string;
  };
};

type ClientOption = {
  id: string;
  fullName: string;
  phone?: string | null;
};

type TaskValue = {
  id?: string;
  updatedAt?: string | Date;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assignedToId?: string | null;
  caseId?: string | null;
  case?: Pick<CaseOption, "id" | "internalFileNumber" | "title"> | null;
  dueDate?: string | Date | null;
};

type DocumentValue = {
  id: string;
  status: string;
  category: string;
  visibility: string;
};

type ApiErrorBody = {
  error?: {
    message?: string;
  };
  data?: {
    id?: string;
  };
};

type ActionMessage = {
  tone: "success" | "error";
  text: string;
};

const taskStatusOptions = ["NEW", "IN_PROGRESS", "REVIEW", "COMPLETED", "OVERDUE", "ARCHIVED"];
const taskPriorityOptions = ["LOW", "NORMAL", "HIGH", "URGENT"];
const documentStatusOptions = ["NEW", "UNDER_REVIEW", "NEEDS_CLARIFICATION", "ACCEPTED", "REJECTED"];
const documentCategoryOptions = ["CONTRACT", "COURT_FILE", "IDENTITY", "EVIDENCE", "PAYMENT", "OTHER"];
const documentVisibilityOptions = ["CLIENT_VISIBLE", "STAFF_ONLY", "INTERNAL_ONLY"];

async function readMessage(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  return body.error?.message ?? "تعذر تنفيذ الإجراء الآن.";
}

function toIsoFromLocal(value: FormDataEntryValue | null) {
  const raw = String(value || "");
  return raw ? new Date(raw).toISOString() : "";
}

function toDateLocal(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function ActionFeedback({ message }: { message: ActionMessage | null }) {
  if (!message) {
    return null;
  }

  return <InlineFeedback title={message.text} tone={message.tone} />;
}

function successMessage(text: string): ActionMessage {
  return { tone: "success", text };
}

function errorMessage(text: string): ActionMessage {
  return { tone: "error", text };
}

function taskPayloadFromForm(form: HTMLFormElement) {
  const formData = new FormData(form);
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    assignedToId: formData.get("assignedToId"),
    caseId: formData.get("caseId"),
    dueDate: toIsoFromLocal(formData.get("dueDate")),
    updatedAt: formData.get("updatedAt") || undefined
  };
}

async function postJson(path: string, method: "POST" | "PATCH", payload: unknown) {
  return fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function TaskCreateForm({
  assignees,
  cases,
  defaultCase
}: {
  assignees: AssigneeOption[];
  cases: CaseOption[];
  defaultCase?: Pick<CaseOption, "id" | "internalFileNumber" | "title">;
}) {
  const router = useRouter();
  const isHydrated = useHydrated();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const controlsDisabled = !isHydrated || isBusy;
  const retainedDefaultCase = defaultCase && !cases.some((legalCase) => legalCase.id === defaultCase.id) ? defaultCase : null;

  if (assignees.length === 0) {
    return <StateBlock tone="permission" title="لا يوجد مستخدمون قابلون للتكليف" description="إنشاء المهام يحتاج مستخدمًا نشطًا يمكن تعيين المهمة له." />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await postJson("/api/admin/tasks", "POST", taskPayloadFromForm(form));
      if (!response.ok) {
        setMessage(errorMessage(await readMessage(response)));
        return;
      }

      form.reset();
      setMessage(successMessage("تم إنشاء المهمة."));
      router.refresh();
    } catch {
      setMessage(errorMessage("لا يمكن الوصول إلى الخادم الآن."));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form aria-label={plan35TaskUiCopy.createFormLabel} className="grid gap-4" onSubmit={submit}>
      <TextInput disabled={controlsDisabled} idPrefix="task-create" label="عنوان المهمة" name="title" required />
      <Textarea disabled={controlsDisabled} idPrefix="task-create" label="الوصف" name="description" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue="NEW" disabled={controlsDisabled} idPrefix="task-create" label="الحالة" name="status">
          {taskStatusOptions.map((status) => (
            <option key={status} value={status}>
              {labelFrom(taskStatusLabels, status)}
            </option>
          ))}
        </Select>
        <Select defaultValue="NORMAL" disabled={controlsDisabled} idPrefix="task-create" label="الأولوية" name="priority">
          {taskPriorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {labelFrom(taskPriorityLabels, priority)}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select disabled={controlsDisabled} idPrefix="task-create" label="المسؤول" name="assignedToId">
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </option>
          ))}
        </Select>
        <TextInput disabled={controlsDisabled} idPrefix="task-create" label="تاريخ الاستحقاق" name="dueDate" type="date" />
      </div>
      <Select defaultValue={defaultCase?.id ?? ""} disabled={controlsDisabled} idPrefix="task-create" label="القضية" name="caseId">
        <option value="">بدون قضية</option>
        {retainedDefaultCase ? (
          <option value={retainedDefaultCase.id}>
            {retainedDefaultCase.internalFileNumber} - {retainedDefaultCase.title} ({plan35TaskUiCopy.retainedCase})
          </option>
        ) : null}
        {cases.map((legalCase) => (
          <option key={legalCase.id} value={legalCase.id}>
            {legalCase.internalFileNumber} - {legalCase.title}
          </option>
        ))}
      </Select>
      <StatefulButton
        aria-busy={isBusy}
        className={buttonClasses()}
        disabled={controlsDisabled}
        type="submit"
      >
        إنشاء المهمة
      </StatefulButton>
      <ActionFeedback message={message} />
    </form>
  );
}

export function TaskUpdateForm({
  task,
  assignees,
  cases
}: {
  task: TaskValue & { id: string };
  assignees: AssigneeOption[];
  cases: CaseOption[];
}) {
  const router = useRouter();
  const isHydrated = useHydrated();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(() => (task.updatedAt ? new Date(task.updatedAt).toISOString() : ""));
  const retainedCase = task.caseId && !cases.some((legalCase) => legalCase.id === task.caseId) ? task.case : null;
  const controlsDisabled = !isHydrated || isBusy;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setNeedsReview(false);
    setIsBusy(true);

    try {
      const response = await postJson(`/api/admin/tasks/${task.id}`, "PATCH", taskPayloadFromForm(event.currentTarget));
      if (!response.ok) {
        setNeedsReview(response.status === 409);
        setMessage(errorMessage(await readMessage(response)));
        return;
      }

      const responseBody = (await response.json()) as { data?: { updatedAt?: string } };
      if (responseBody.data?.updatedAt) {
        setExpectedUpdatedAt(new Date(responseBody.data.updatedAt).toISOString());
      }
      setMessage(successMessage("تم حفظ المهمة."));
      router.refresh();
    } catch {
      setMessage(errorMessage("لا يمكن الوصول إلى الخادم الآن."));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="mt-3 grid gap-3 rounded border border-kmt-border bg-slate-50 p-3" onSubmit={submit}>
      <input id={`task-update-${task.id}-updatedAt`} name="updatedAt" type="hidden" value={expectedUpdatedAt} />
      <TextInput defaultValue={task.title ?? ""} disabled={controlsDisabled} idPrefix={`task-update-${task.id}`} label="العنوان" name="title" required />
      <Textarea defaultValue={task.description ?? ""} disabled={controlsDisabled} idPrefix={`task-update-${task.id}`} label="الوصف" name="description" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select defaultValue={task.status ?? "NEW"} disabled={controlsDisabled} idPrefix={`task-update-${task.id}`} label="الحالة" name="status">
          {taskStatusOptions.map((status) => (
            <option key={status} value={status}>
              {labelFrom(taskStatusLabels, status)}
            </option>
          ))}
        </Select>
        <Select defaultValue={task.priority ?? "NORMAL"} disabled={controlsDisabled} idPrefix={`task-update-${task.id}`} label="الأولوية" name="priority">
          {taskPriorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {labelFrom(taskPriorityLabels, priority)}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select defaultValue={task.assignedToId ?? ""} disabled={controlsDisabled} idPrefix={`task-update-${task.id}`} label="المسؤول" name="assignedToId">
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </option>
          ))}
        </Select>
        <TextInput defaultValue={toDateLocal(task.dueDate)} disabled={controlsDisabled} idPrefix={`task-update-${task.id}`} label="تاريخ الاستحقاق" name="dueDate" type="date" />
      </div>
      <Select defaultValue={task.caseId ?? ""} disabled={controlsDisabled} idPrefix={`task-update-${task.id}`} label="القضية" name="caseId">
        <option value="">بدون قضية</option>
        {retainedCase ? (
          <option value={retainedCase.id}>
            {retainedCase.internalFileNumber} - {retainedCase.title} ({plan35TaskUiCopy.retainedCase})
          </option>
        ) : null}
        {cases.map((legalCase) => (
          <option key={legalCase.id} value={legalCase.id}>
            {legalCase.internalFileNumber} - {legalCase.title}
          </option>
        ))}
      </Select>
      <StatefulButton
        aria-busy={isBusy}
        className={buttonClasses({ variant: "secondary", size: "sm" })}
        disabled={controlsDisabled}
        type="submit"
      >
        حفظ المهمة
      </StatefulButton>
      <ActionFeedback message={message} />
      {needsReview ? (
        <Button onClick={() => window.location.reload()} size="sm" type="button" variant="secondary">
          {plan35TaskUiCopy.reviewLatest}
        </Button>
      ) : null}
    </form>
  );
}

export function AdminDocumentUploadForm({
  cases,
  clients,
  canManage,
  defaultCase
}: {
  cases: CaseOption[];
  clients: ClientOption[];
  canManage: boolean;
  defaultCase?: Pick<CaseOption, "id" | "internalFileNumber" | "title">;
}) {
  const router = useRouter();
  const isHydrated = useHydrated();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const retainedDefaultCase = defaultCase && !cases.some((legalCase) => legalCase.id === defaultCase.id) ? defaultCase : null;

  if (!canManage) {
    return <StateBlock tone="permission" title="رفع المستندات غير متاح" description="يمكنك قراءة المستندات داخل نطاقك، لكن الرفع أو تغيير الحالة يحتاج صلاحية إدارة المستندات." />;
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!selectedFile) {
      setMessage(errorMessage("اختر ملفًا لرفعه قبل الإرسال."));
      return;
    }

    setIsUploading(true);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      formData.set("file", selectedFile);
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        setMessage(errorMessage(await readMessage(response)));
        return;
      }

      form.reset();
      setSelectedFile(null);
      setUploadKey((key) => key + 1);
      setMessage(successMessage("تم رفع المستند."));
      router.refresh();
    } catch {
      setMessage(errorMessage("لا يمكن الوصول إلى الخادم الآن."));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="grid gap-4" method="post" onSubmit={upload}>
      <Select defaultValue={defaultCase?.id ?? ""} disabled={!isHydrated || isUploading} idPrefix="document-upload" label="القضية" name="caseId">
        <option value="">بدون قضية</option>
        {retainedDefaultCase ? (
          <option value={retainedDefaultCase.id}>
            {retainedDefaultCase.internalFileNumber} - {retainedDefaultCase.title} ({plan35TaskUiCopy.retainedCase})
          </option>
        ) : null}
        {cases.map((legalCase) => (
          <option key={legalCase.id} value={legalCase.id}>
            {legalCase.internalFileNumber} - {legalCase.title}
          </option>
        ))}
      </Select>
      <Select disabled={!isHydrated || isUploading} idPrefix="document-upload" label="العميل المالك" name="ownerClientId">
        <option value="">غير محدد</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.fullName}
          </option>
        ))}
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue="OTHER" disabled={!isHydrated || isUploading} idPrefix="document-upload" label="التصنيف" name="category">
          {documentCategoryOptions.map((category) => (
            <option key={category} value={category}>
              {labelFrom(documentCategoryLabels, category)}
            </option>
          ))}
        </Select>
        <Select defaultValue="STAFF_ONLY" disabled={!isHydrated || isUploading} idPrefix="document-upload" label="الظهور" name="visibility">
          {documentVisibilityOptions.map((visibility) => (
            <option key={visibility} value={visibility}>
              {labelFrom(documentVisibilityLabels, visibility)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <span className="block text-sm font-semibold text-kmt-ink" id="document-upload-file-label">
          الملف
        </span>
        <div className="rounded-lg border border-kmt-border bg-white px-2 py-2">
          <FileUpload
            key={uploadKey}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
            onChange={(files) => setSelectedFile(files[files.length - 1] ?? null)}
          />
        </div>
        <p className="text-sm leading-6 text-kmt-muted" id="document-upload-file-hint">الحد الأقصى 5MB. الأنواع المسموحة: PDF, DOC, DOCX, JPG, PNG.</p>
      </div>
      <StatefulButton
        aria-busy={isUploading}
        className={buttonClasses()}
        disabled={!isHydrated || isUploading}
        type="submit"
      >
        رفع المستند
      </StatefulButton>
      <ActionFeedback message={message} />
    </form>
  );
}

export function DocumentActionForm({ document, canManage }: { document: DocumentValue; canManage: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (!canManage) {
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsBusy(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await postJson(`/api/admin/documents/${document.id}`, "PATCH", {
        status: formData.get("status"),
        category: formData.get("category"),
        visibility: formData.get("visibility"),
        note: formData.get("note")
      });

      if (!response.ok) {
        setMessage(errorMessage(await readMessage(response)));
        return;
      }

      setMessage(successMessage("تم حفظ المستند."));
      router.refresh();
    } catch {
      setMessage(errorMessage("لا يمكن الوصول إلى الخادم الآن."));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="mt-3 grid gap-3 rounded border border-kmt-border bg-slate-50 p-3" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select defaultValue={document.status} disabled={isBusy} idPrefix={`document-action-${document.id}`} label="الحالة" name="status">
          {documentStatusOptions.map((status) => (
            <option key={status} value={status}>
              {labelFrom(documentStatusLabels, status)}
            </option>
          ))}
        </Select>
        <Select defaultValue={document.category} disabled={isBusy} idPrefix={`document-action-${document.id}`} label="التصنيف" name="category">
          {documentCategoryOptions.map((category) => (
            <option key={category} value={category}>
              {labelFrom(documentCategoryLabels, category)}
            </option>
          ))}
        </Select>
        <Select defaultValue={document.visibility} disabled={isBusy} idPrefix={`document-action-${document.id}`} label="الظهور" name="visibility">
          {documentVisibilityOptions.map((visibility) => (
            <option key={visibility} value={visibility}>
              {labelFrom(documentVisibilityLabels, visibility)}
            </option>
          ))}
        </Select>
      </div>
      <Textarea disabled={isBusy} idPrefix={`document-action-${document.id}`} label="ملاحظة داخلية" name="note" />
      <StatefulButton
        aria-busy={isBusy}
        className={buttonClasses({ variant: "secondary", size: "sm" })}
        disabled={isBusy}
        type="submit"
      >
        حفظ المستند
      </StatefulButton>
      <ActionFeedback message={message} />
    </form>
  );
}

export function DocumentDeleteForm({ documentId, canManage }: { documentId: string; canManage: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!canManage) {
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsBusy(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await postJson(`/api/admin/documents/${documentId}/delete`, "POST", {
        reason: formData.get("reason"),
        confirmDelete: formData.get("confirmDelete") === "on"
      });

      if (!response.ok) {
        setMessage(errorMessage(await readMessage(response)));
        return;
      }

      setMessage(successMessage("تم حذف المستند من القوائم النشطة."));
      router.refresh();
    } catch {
      setMessage(errorMessage("لا يمكن الوصول إلى الخادم الآن."));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <form ref={formRef} className="mt-3 space-y-3 rounded border border-kmt-danger-border bg-kmt-danger-surface p-3" onSubmit={submit}>
        <Textarea disabled={isBusy} idPrefix={`document-delete-${documentId}`} label="سبب الحذف" name="reason" />
        <label className="flex items-start gap-2 text-sm leading-6 text-kmt-ink">
          <input className="mt-1 h-4 w-4 rounded border-slate-300 text-kmt-danger focus:ring-kmt-gold" disabled={isBusy} id={`document-delete-${documentId}-confirmDelete`} name="confirmDelete" required type="checkbox" />
          <span>أؤكد حذف المستند من القوائم النشطة. الملف لا يتم نشره أو عرضه بعد الحذف.</span>
        </label>
        <Button disabled={isBusy} size="sm" type="button" variant="danger" onClick={() => setConfirmOpen(true)}>
          حذف المستند
        </Button>
        <ActionFeedback message={message} />
      </form>
      <AdminDialog
        variant="destructive"
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="تأكيد حذف المستند"
        description="سيتم حذف المستند من القوائم النشطة. الملف لا يتم نشره أو عرضه بعد الحذف. لا يمكن التراجع عن هذا الإجراء من هنا."
        confirmLabel="تأكيد الحذف"
        cancelLabel="إلغاء"
        confirmBusy={isBusy}
        onConfirm={() => {
          setConfirmOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
