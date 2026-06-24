"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  StateBlock,
  TextInput,
  Textarea
} from "@/components/ui";
import { appointmentTypeLabels, caseStatusLabels, labelFrom, modeLabels } from "@/lib/legal-format";

type ApiErrorBody = {
  error?: {
    message?: string;
  };
};

type CaseOption = {
  id: string;
  internalFileNumber: string;
  title: string;
  client: {
    fullName: string;
  };
};

type AppointmentRescheduleFormProps = {
  appointmentId: string;
  status: string;
  startsAt: string | Date;
  mode: string;
  location?: string | null;
};

type ActionMessage = {
  tone: "success" | "error";
  text: string;
};

const caseStatusOptions = ["NEW", "UNDER_REVIEW", "ACTIVE", "AWAITING_JUDGMENT", "COMPLETED", "CLOSED", "ARCHIVED"];
const appointmentTypeOptions = ["CONSULTATION", "COURT_SESSION", "INTERNAL_MEETING", "CALL", "ONLINE_MEETING"];
const appointmentModeOptions = ["COURT", "OFFICE", "ONLINE", "PHONE"];

async function readMessage(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  return body.error?.message ?? "تعذر تنفيذ الإجراء الآن.";
}

function toIsoFromLocal(value: FormDataEntryValue | null) {
  const raw = String(value || "");
  return raw ? new Date(raw).toISOString() : "";
}

function toDateTimeLocal(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function StatusMessage({ message }: { message: ActionMessage | null }) {
  if (!message) {
    return null;
  }

  const className =
    message.tone === "error"
      ? "rounded border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-kmt-danger"
      : "rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-900";

  return (
    <div className={className} role={message.tone === "error" ? "alert" : "status"}>
      {message.text}
    </div>
  );
}

function useJsonAction() {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function postJson(path: string, payload: unknown, successMessage: string) {
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setMessage({ tone: "error", text: await readMessage(response) });
        return;
      }

      setMessage({ tone: "success", text: successMessage });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
    } finally {
      setIsBusy(false);
    }
  }

  return { message, isBusy, postJson };
}

export function CaseStatusForm({
  caseId,
  currentStatus,
  canUpdate
}: {
  caseId: string;
  currentStatus: string;
  canUpdate: boolean;
}) {
  const { message, isBusy, postJson } = useJsonAction();

  if (!canUpdate) {
    return (
      <StateBlock
        tone="permission"
        title="صلاحية قراءة فقط"
        description="يمكنك مراجعة ملف القضية داخل نطاقك، لكن تغيير حالة القضية يحتاج صلاحية تحديث القضية."
      />
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    postJson(
      `/api/admin/cases/${caseId}/status`,
      {
        status: formData.get("status"),
        reason: formData.get("reason"),
        confirmStatusChange: formData.get("confirmStatusChange") === "on"
      },
      "تم تحديث حالة القضية."
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>تغيير حالة القضية</CardTitle>
        <CardDescription>أي تغيير حالة يتم تسجيله في سجل التدقيق. لا تستخدم الإغلاق أو الأرشفة إلا بعد مراجعة الملف.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>
          <Select defaultValue={currentStatus} disabled={isBusy} label="الحالة الجديدة" name="status">
            {caseStatusOptions.map((status) => (
              <option key={status} value={status}>
                {labelFrom(caseStatusLabels, status)}
              </option>
            ))}
          </Select>
          <Textarea disabled={isBusy} label="سبب التغيير" name="reason" />
          <label className="flex items-start gap-2 text-sm leading-6 text-kmt-ink">
            <input className="mt-1 h-4 w-4 rounded border-slate-300 text-kmt-navy focus:ring-kmt-gold" disabled={isBusy} name="confirmStatusChange" required type="checkbox" />
            <span>أؤكد أن تغيير الحالة تمت مراجعته وأنه مناسب لملف القضية.</span>
          </label>
          <Button loading={isBusy} type="submit">
            حفظ الحالة
          </Button>
          <StatusMessage message={message} />
        </form>
      </CardContent>
    </Card>
  );
}

export function CaseSessionForm({
  caseId,
  canManage,
  defaultCourtName
}: {
  caseId: string;
  canManage: boolean;
  defaultCourtName?: string | null;
}) {
  const { message, isBusy, postJson } = useJsonAction();

  if (!canManage) {
    return (
      <StateBlock
        tone="permission"
        title="إضافة الجلسات غير متاحة"
        description="إضافة جلسة أو تحديث تاريخ الجلسة القادمة يحتاج صلاحية إدارة جلسات القضية."
      />
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    postJson(
      `/api/admin/cases/${caseId}/sessions`,
      {
        courtName: formData.get("courtName"),
        sessionDate: toIsoFromLocal(formData.get("sessionDate")),
        decision: formData.get("decision"),
        nextAction: formData.get("nextAction"),
        nextSessionDate: toIsoFromLocal(formData.get("nextSessionDate"))
      },
      "تمت إضافة الجلسة."
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إضافة جلسة</CardTitle>
        <CardDescription>تسجيل جلسة محكمة أو متابعة داخلية مرتبطة بالقضية. تاريخ الجلسة القادمة يحدث ملف القضية.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>
          <TextInput defaultValue={defaultCourtName ?? ""} disabled={isBusy} label="المحكمة" name="courtName" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput disabled={isBusy} label="تاريخ الجلسة" name="sessionDate" required type="datetime-local" />
            <TextInput disabled={isBusy} label="الجلسة القادمة" name="nextSessionDate" type="datetime-local" />
          </div>
          <Textarea disabled={isBusy} label="القرار أو النتيجة" name="decision" />
          <Textarea disabled={isBusy} label="الإجراء القادم" name="nextAction" />
          <Button loading={isBusy} type="submit">
            إضافة الجلسة
          </Button>
          <StatusMessage message={message} />
        </form>
      </CardContent>
    </Card>
  );
}

export function CalendarAppointmentForm({ cases, defaultCaseId }: { cases: CaseOption[]; defaultCaseId?: string }) {
  const { message, isBusy, postJson } = useJsonAction();

  if (cases.length === 0) {
    return (
      <StateBlock
        title="لا توجد قضايا مفتوحة للجدولة"
        description="إنشاء موعد في التقويم يحتاج قضية مفتوحة داخل نطاق صلاحياتك."
      />
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    postJson(
      "/api/admin/calendar",
      {
        caseId: formData.get("caseId"),
        title: formData.get("title"),
        type: formData.get("type"),
        mode: formData.get("mode"),
        location: formData.get("location"),
        startsAt: toIsoFromLocal(formData.get("startsAt")),
        durationMinutes: formData.get("durationMinutes"),
        notes: formData.get("notes")
      },
      "تم إنشاء الموعد."
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>موعد جديد</CardTitle>
        <CardDescription>إنشاء موعد مرتبط بقضية. مواعيد العملاء المستقلة أو التذكيرات المتقدمة خارج نطاق هذه الخطة.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>
          <Select defaultValue={defaultCaseId} disabled={isBusy} label="القضية" name="caseId" required>
            {cases.map((legalCase) => (
              <option key={legalCase.id} value={legalCase.id}>
                {legalCase.internalFileNumber} - {legalCase.client.fullName}
              </option>
            ))}
          </Select>
          <TextInput disabled={isBusy} label="عنوان الموعد" name="title" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select defaultValue="COURT_SESSION" disabled={isBusy} label="نوع الموعد" name="type">
              {appointmentTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {labelFrom(appointmentTypeLabels, type)}
                </option>
              ))}
            </Select>
            <Select defaultValue="COURT" disabled={isBusy} label="طريقة الموعد" name="mode">
              {appointmentModeOptions.map((mode) => (
                <option key={mode} value={mode}>
                  {labelFrom(modeLabels, mode)}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput disabled={isBusy} label="وقت الموعد" name="startsAt" required type="datetime-local" />
            <TextInput defaultValue="60" disabled={isBusy} label="المدة بالدقائق" name="durationMinutes" type="number" />
          </div>
          <TextInput disabled={isBusy} label="المكان أو الرابط" name="location" />
          <Textarea disabled={isBusy} label="ملاحظات" name="notes" />
          <Button loading={isBusy} type="submit">
            إنشاء الموعد
          </Button>
          <StatusMessage message={message} />
        </form>
      </CardContent>
    </Card>
  );
}

export function AppointmentRescheduleForm({ appointmentId, status, startsAt, mode, location }: AppointmentRescheduleFormProps) {
  const { message, isBusy, postJson } = useJsonAction();
  const isClosed = status === "COMPLETED" || status === "CANCELLED" || status === "NO_SHOW";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    postJson(
      `/api/admin/calendar/${appointmentId}/reschedule`,
      {
        startsAt: toIsoFromLocal(formData.get("startsAt")),
        durationMinutes: formData.get("durationMinutes"),
        mode: formData.get("mode"),
        location: formData.get("location"),
        reason: formData.get("reason")
      },
      "تمت إعادة جدولة الموعد."
    );
  }

  return (
    <form className="mt-3 grid gap-3 rounded border border-kmt-border bg-slate-50 p-3" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput defaultValue={toDateTimeLocal(startsAt)} disabled={isBusy || isClosed} label="موعد جديد" name="startsAt" required type="datetime-local" />
        <TextInput defaultValue="60" disabled={isBusy || isClosed} label="المدة بالدقائق" name="durationMinutes" type="number" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select defaultValue={mode} disabled={isBusy || isClosed} label="الطريقة" name="mode">
          {appointmentModeOptions.map((option) => (
            <option key={option} value={option}>
              {labelFrom(modeLabels, option)}
            </option>
          ))}
        </Select>
        <TextInput defaultValue={location ?? ""} disabled={isBusy || isClosed} label="المكان أو الرابط" name="location" />
      </div>
      <Textarea disabled={isBusy || isClosed} label="سبب إعادة الجدولة" name="reason" />
      <Button disabled={isClosed} loading={isBusy} size="sm" type="submit" variant="secondary">
        إعادة الجدولة
      </Button>
      <StatusMessage message={message} />
    </form>
  );
}
