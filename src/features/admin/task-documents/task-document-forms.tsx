"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button, InlineFeedback, Select, StateBlock, TextInput, Textarea } from "@/components/ui";
import {
  documentCategoryLabels,
  documentStatusLabels,
  documentVisibilityLabels,
  labelFrom,
  taskPriorityLabels,
  taskStatusLabels
} from "@/lib/legal-format";

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
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assignedToId?: string | null;
  caseId?: string | null;
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
    dueDate: toIsoFromLocal(formData.get("dueDate"))
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
  defaultCaseId
}: {
  assignees: AssigneeOption[];
  cases: CaseOption[];
  defaultCaseId?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (assignees.length === 0) {
    return <StateBlock tone="permission" title="لا يوجد مستخدمون قابلون للتكليف" description="إنشاء المهام يحتاج مستخدمًا نشطًا يمكن تعيين المهمة له." />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await postJson("/api/admin/tasks", "POST", taskPayloadFromForm(event.currentTarget));
      if (!response.ok) {
        setMessage(errorMessage(await readMessage(response)));
        return;
      }

      event.currentTarget.reset();
      setMessage(successMessage("تم إنشاء المهمة."));
      router.refresh();
    } catch {
      setMessage(errorMessage("لا يمكن الوصول إلى الخادم الآن."));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <TextInput disabled={isBusy} idPrefix="task-create" label="عنوان المهمة" name="title" required />
      <Textarea disabled={isBusy} idPrefix="task-create" label="الوصف" name="description" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue="NEW" disabled={isBusy} idPrefix="task-create" label="الحالة" name="status">
          {taskStatusOptions.map((status) => (
            <option key={status} value={status}>
              {labelFrom(taskStatusLabels, status)}
            </option>
          ))}
        </Select>
        <Select defaultValue="NORMAL" disabled={isBusy} idPrefix="task-create" label="الأولوية" name="priority">
          {taskPriorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {labelFrom(taskPriorityLabels, priority)}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select disabled={isBusy} idPrefix="task-create" label="المسؤول" name="assignedToId">
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </option>
          ))}
        </Select>
        <TextInput disabled={isBusy} idPrefix="task-create" label="تاريخ الاستحقاق" name="dueDate" type="date" />
      </div>
      <Select defaultValue={defaultCaseId ?? ""} disabled={isBusy} idPrefix="task-create" label="القضية" name="caseId">
        <option value="">بدون قضية</option>
        {cases.map((legalCase) => (
          <option key={legalCase.id} value={legalCase.id}>
            {legalCase.internalFileNumber} - {legalCase.title}
          </option>
        ))}
      </Select>
      <Button loading={isBusy} type="submit">
        إنشاء المهمة
      </Button>
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
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await postJson(`/api/admin/tasks/${task.id}`, "PATCH", taskPayloadFromForm(event.currentTarget));
      if (!response.ok) {
        setMessage(errorMessage(await readMessage(response)));
        return;
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
      <TextInput defaultValue={task.title ?? ""} disabled={isBusy} idPrefix={`task-update-${task.id}`} label="العنوان" name="title" required />
      <Textarea defaultValue={task.description ?? ""} disabled={isBusy} idPrefix={`task-update-${task.id}`} label="الوصف" name="description" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select defaultValue={task.status ?? "NEW"} disabled={isBusy} idPrefix={`task-update-${task.id}`} label="الحالة" name="status">
          {taskStatusOptions.map((status) => (
            <option key={status} value={status}>
              {labelFrom(taskStatusLabels, status)}
            </option>
          ))}
        </Select>
        <Select defaultValue={task.priority ?? "NORMAL"} disabled={isBusy} idPrefix={`task-update-${task.id}`} label="الأولوية" name="priority">
          {taskPriorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {labelFrom(taskPriorityLabels, priority)}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select defaultValue={task.assignedToId ?? ""} disabled={isBusy} idPrefix={`task-update-${task.id}`} label="المسؤول" name="assignedToId">
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </option>
          ))}
        </Select>
        <TextInput defaultValue={toDateLocal(task.dueDate)} disabled={isBusy} idPrefix={`task-update-${task.id}`} label="تاريخ الاستحقاق" name="dueDate" type="date" />
      </div>
      <Select defaultValue={task.caseId ?? ""} disabled={isBusy} idPrefix={`task-update-${task.id}`} label="القضية" name="caseId">
        <option value="">بدون قضية</option>
        {cases.map((legalCase) => (
          <option key={legalCase.id} value={legalCase.id}>
            {legalCase.internalFileNumber} - {legalCase.title}
          </option>
        ))}
      </Select>
      <Button loading={isBusy} size="sm" type="submit" variant="secondary">
        حفظ المهمة
      </Button>
      <ActionFeedback message={message} />
    </form>
  );
}

export function AdminDocumentUploadForm({
  cases,
  clients,
  canManage,
  defaultCaseId
}: {
  cases: CaseOption[];
  clients: ClientOption[];
  canManage: boolean;
  defaultCaseId?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!canManage) {
    return <StateBlock tone="permission" title="رفع المستندات غير متاح" description="يمكنك قراءة المستندات داخل نطاقك، لكن الرفع أو تغيير الحالة يحتاج صلاحية إدارة المستندات." />;
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsUploading(true);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        setMessage(errorMessage(await readMessage(response)));
        return;
      }

      form.reset();
      setMessage(successMessage("تم رفع المستند."));
      router.refresh();
    } catch {
      setMessage(errorMessage("لا يمكن الوصول إلى الخادم الآن."));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={upload}>
      <Select defaultValue={defaultCaseId ?? ""} disabled={isUploading} idPrefix="document-upload" label="القضية" name="caseId">
        <option value="">بدون قضية</option>
        {cases.map((legalCase) => (
          <option key={legalCase.id} value={legalCase.id}>
            {legalCase.internalFileNumber} - {legalCase.title}
          </option>
        ))}
      </Select>
      <Select disabled={isUploading} idPrefix="document-upload" label="العميل المالك" name="ownerClientId">
        <option value="">غير محدد</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.fullName}
          </option>
        ))}
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue="OTHER" disabled={isUploading} idPrefix="document-upload" label="التصنيف" name="category">
          {documentCategoryOptions.map((category) => (
            <option key={category} value={category}>
              {labelFrom(documentCategoryLabels, category)}
            </option>
          ))}
        </Select>
        <Select defaultValue="STAFF_ONLY" disabled={isUploading} idPrefix="document-upload" label="الظهور" name="visibility">
          {documentVisibilityOptions.map((visibility) => (
            <option key={visibility} value={visibility}>
              {labelFrom(documentVisibilityLabels, visibility)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-kmt-ink" htmlFor="document-upload-file">
          الملف
        </label>
        <input
          id="document-upload-file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
          className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm"
          disabled={isUploading}
          name="file"
          required
          type="file"
          aria-describedby="document-upload-file-hint"
        />
        <p className="text-sm leading-6 text-kmt-muted" id="document-upload-file-hint">الحد الأقصى 5MB. الأنواع المسموحة: PDF, DOC, DOCX, JPG, PNG.</p>
      </div>
      <Button loading={isUploading} type="submit">
        رفع المستند
      </Button>
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
      <Button loading={isBusy} size="sm" type="submit" variant="secondary">
        حفظ المستند
      </Button>
      <ActionFeedback message={message} />
    </form>
  );
}

export function DocumentDeleteForm({ documentId, canManage }: { documentId: string; canManage: boolean }) {
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
    <form className="mt-3 space-y-3 rounded border border-kmt-danger-border bg-kmt-danger-surface p-3" onSubmit={submit}>
      <Textarea disabled={isBusy} idPrefix={`document-delete-${documentId}`} label="سبب الحذف" name="reason" />
      <label className="flex items-start gap-2 text-sm leading-6 text-kmt-ink">
        <input className="mt-1 h-4 w-4 rounded border-slate-300 text-kmt-danger focus:ring-kmt-gold" disabled={isBusy} id={`document-delete-${documentId}-confirmDelete`} name="confirmDelete" required type="checkbox" />
        <span>أؤكد حذف المستند من القوائم النشطة. الملف لا يتم نشره أو عرضه بعد الحذف.</span>
      </label>
      <Button loading={isBusy} size="sm" type="submit" variant="danger">
        حذف المستند
      </Button>
      <ActionFeedback message={message} />
    </form>
  );
}
