"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InlineFeedback,
  Select,
  StateBlock,
  TextInput,
  Textarea
} from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { AdminDialog } from "@/components/admin/admin-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/animate-ui/components/radix/sheet";
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

function ActionFeedback({ message }: { message: ActionMessage | null }) {
  if (!message) {
    return null;
  }

  return <InlineFeedback title={message.text} tone={message.tone} />;
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
          <Select defaultValue={currentStatus} disabled={isBusy} idPrefix={`case-status-${caseId}`} label="الحالة الجديدة" name="status">
            {caseStatusOptions.map((status) => (
              <option key={status} value={status}>
                {labelFrom(caseStatusLabels, status)}
              </option>
            ))}
          </Select>
          <Textarea disabled={isBusy} idPrefix={`case-status-${caseId}`} label="سبب التغيير" name="reason" />
          <label className="flex items-start gap-2 text-sm leading-6 text-kmt-ink">
            <input className="mt-1 h-4 w-4 rounded border-slate-300 text-kmt-navy focus:ring-kmt-gold" disabled={isBusy} id={`case-status-${caseId}-confirmStatusChange`} name="confirmStatusChange" required type="checkbox" />
            <span>أؤكد أن تغيير الحالة تمت مراجعته وأنه مناسب لملف القضية.</span>
          </label>
          <StatefulButton
            aria-busy={isBusy}
            className={buttonClasses()}
            disabled={isBusy}
            type="submit"
          >
            حفظ الحالة
          </StatefulButton>
          <ActionFeedback message={message} />
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
          <TextInput defaultValue={defaultCourtName ?? ""} disabled={isBusy} idPrefix={`case-session-${caseId}`} label="المحكمة" name="courtName" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput disabled={isBusy} idPrefix={`case-session-${caseId}`} label="تاريخ الجلسة" name="sessionDate" required type="datetime-local" />
            <TextInput disabled={isBusy} idPrefix={`case-session-${caseId}`} label="الجلسة القادمة" name="nextSessionDate" type="datetime-local" />
          </div>
          <Textarea disabled={isBusy} idPrefix={`case-session-${caseId}`} label="القرار أو النتيجة" name="decision" />
          <Textarea disabled={isBusy} idPrefix={`case-session-${caseId}`} label="الإجراء القادم" name="nextAction" />
          <StatefulButton
            aria-busy={isBusy}
            className={buttonClasses()}
            disabled={isBusy}
            type="submit"
          >
            إضافة الجلسة
          </StatefulButton>
          <ActionFeedback message={message} />
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
          <Select defaultValue={defaultCaseId} disabled={isBusy} idPrefix="calendar-appointment" label="القضية" name="caseId" required>
            {cases.map((legalCase) => (
              <option key={legalCase.id} value={legalCase.id}>
                {legalCase.internalFileNumber} - {legalCase.client.fullName}
              </option>
            ))}
          </Select>
          <TextInput disabled={isBusy} idPrefix="calendar-appointment" label="عنوان الموعد" name="title" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select defaultValue="COURT_SESSION" disabled={isBusy} idPrefix="calendar-appointment" label="نوع الموعد" name="type">
              {appointmentTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {labelFrom(appointmentTypeLabels, type)}
                </option>
              ))}
            </Select>
            <Select defaultValue="COURT" disabled={isBusy} idPrefix="calendar-appointment" label="طريقة الموعد" name="mode">
              {appointmentModeOptions.map((mode) => (
                <option key={mode} value={mode}>
                  {labelFrom(modeLabels, mode)}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput disabled={isBusy} idPrefix="calendar-appointment" label="وقت الموعد" name="startsAt" required type="datetime-local" />
            <TextInput defaultValue="60" disabled={isBusy} idPrefix="calendar-appointment" label="المدة بالدقائق" name="durationMinutes" type="number" />
          </div>
          <TextInput disabled={isBusy} idPrefix="calendar-appointment" label="المكان أو الرابط" name="location" />
          <Textarea disabled={isBusy} idPrefix="calendar-appointment" label="ملاحظات" name="notes" />
          <StatefulButton
            aria-busy={isBusy}
            className={buttonClasses()}
            disabled={isBusy}
            type="submit"
          >
            إنشاء الموعد
          </StatefulButton>
          <ActionFeedback message={message} />
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
        <TextInput defaultValue={toDateTimeLocal(startsAt)} disabled={isBusy || isClosed} idPrefix={`appointment-reschedule-${appointmentId}`} label="موعد جديد" name="startsAt" required type="datetime-local" />
        <TextInput defaultValue="60" disabled={isBusy || isClosed} idPrefix={`appointment-reschedule-${appointmentId}`} label="المدة بالدقائق" name="durationMinutes" type="number" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select defaultValue={mode} disabled={isBusy || isClosed} idPrefix={`appointment-reschedule-${appointmentId}`} label="الطريقة" name="mode">
          {appointmentModeOptions.map((option) => (
            <option key={option} value={option}>
              {labelFrom(modeLabels, option)}
            </option>
          ))}
        </Select>
        <TextInput defaultValue={location ?? ""} disabled={isBusy || isClosed} idPrefix={`appointment-reschedule-${appointmentId}`} label="المكان أو الرابط" name="location" />
      </div>
      <Textarea disabled={isBusy || isClosed} idPrefix={`appointment-reschedule-${appointmentId}`} label="سبب إعادة الجدولة" name="reason" />
      <StatefulButton
        aria-busy={isBusy}
        className={buttonClasses({ variant: "secondary", size: "sm" })}
        disabled={isClosed || isBusy}
        type="submit"
      >
        إعادة الجدولة
      </StatefulButton>
      <ActionFeedback message={message} />
    </form>
  );
}

/**
 * Calendar create/reschedule overlays (Phase 11). ONE underlying form
 * component per operation (no forked logic): the desktop trigger opens an
 * Animate UI Dialog, the mobile trigger opens an Animate UI Sheet. Only
 * the opened shell mounts its form (closed overlays unmount), so the two
 * placements never duplicate fields. Blocked/validation states live in
 * the shared forms and are preserved verbatim.
 */
export function CalendarAppointmentDialogs({ cases, defaultCaseId }: { cases: CaseOption[]; defaultCaseId?: string }) {
  return (
    <>
      <span className="hidden lg:block">
        <AdminDialog
          variant="form"
          trigger={
            <button className={buttonClasses()} type="button">
              موعد جديد
            </button>
          }
          title="موعد جديد"
          description="إنشاء موعد مرتبط بقضية. مواعيد العملاء المستقلة أو التذكيرات المتقدمة خارج نطاق هذه الخطة."
        >
          <CalendarAppointmentForm cases={cases} defaultCaseId={defaultCaseId} />
        </AdminDialog>
      </span>
      <span className="lg:hidden">
        <Sheet>
          <SheetTrigger className={buttonClasses({ className: "w-full" })}>موعد جديد</SheetTrigger>
          <SheetContent aria-label="موعد جديد" className="overflow-y-auto border-kmt-border bg-white text-kmt-ink" side="right">
            <SheetHeader>
              <SheetTitle className="text-kmt-ink">موعد جديد</SheetTitle>
              <SheetDescription className="text-kmt-muted">
                إنشاء موعد مرتبط بقضية. مواعيد العملاء المستقلة أو التذكيرات المتقدمة خارج نطاق هذه الخطة.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <CalendarAppointmentForm cases={cases} defaultCaseId={defaultCaseId} />
            </div>
          </SheetContent>
        </Sheet>
      </span>
    </>
  );
}

export function AppointmentRescheduleDialogs(props: AppointmentRescheduleFormProps) {
  return (
    <>
      <span className="hidden lg:block">
        <AdminDialog
          variant="form"
          trigger={
            <button className={buttonClasses({ variant: "secondary", size: "sm" })} type="button">
              إعادة الجدولة
            </button>
          }
          title="إعادة الجدولة"
        >
          <AppointmentRescheduleForm {...props} />
        </AdminDialog>
      </span>
      <span className="lg:hidden">
        <Sheet>
          <SheetTrigger className={buttonClasses({ variant: "secondary", size: "sm" })}>إعادة الجدولة</SheetTrigger>
          <SheetContent aria-label="إعادة الجدولة" className="overflow-y-auto border-kmt-border bg-white text-kmt-ink" side="right">
            <SheetHeader>
              <SheetTitle className="text-kmt-ink">إعادة الجدولة</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <AppointmentRescheduleForm {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </span>
    </>
  );
}
