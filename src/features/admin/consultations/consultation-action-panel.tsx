"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Button, InlineFeedback, Select, Textarea, TextInput } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { useInvalidFieldAccordion } from "@/components/admin/use-invalid-field-accordion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/animate-ui/components/radix/accordion";
import {
  commonUiCopy,
  plan36ConsultationOutcomeCopy as outcomeCopy,
  plan37ConsultationOverdueCopy as overdueCopy
} from "@/lib/ui-copy";
import { readAdminApiErrorMessage } from "@/features/admin/shared/admin-api-error";
import { ConsultationOutcomeForm } from "./consultation-outcome-form";
import { ConsultationReopenForm } from "./consultation-reopen-form";
import { ConsultationScheduleForm } from "./consultation-schedule-form";

type LawyerOption = {
  id: string;
  name: string;
  email: string;
};

type ApiSuccessBody = {
  data?: {
    nextReviewHref?: string | null;
  };
};

type ActionMessage = {
  tone: "success" | "error";
  text: string;
};

async function readMessage(response: Response) {
  return readAdminApiErrorMessage(response, outcomeCopy.feedback.failed);
}

export function ConsultationActionPanel({
  consultationId,
  status,
  assignedLawyerId,
  secretaryReviewedAt,
  secretaryReviewedByName,
  secretaryReviewNote,
  outcomeStatus,
  outcomeVersion,
  canAssign: canAssignConsultation,
  canManageOutcome,
  canReopen,
  canSchedule,
  lawyers
}: {
  consultationId: string;
  status: string;
  assignedLawyerId?: string | null;
  secretaryReviewedAt?: string | null;
  secretaryReviewedByName?: string | null;
  secretaryReviewNote?: string | null;
  outcomeStatus: string;
  outcomeVersion: number;
  canAssign: boolean;
  canManageOutcome: boolean;
  canReopen: boolean;
  canSchedule: boolean;
  lawyers: LawyerOption[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const convertFormRef = useRef<HTMLFormElement>(null);
  const rejectFormRef = useRef<HTMLFormElement>(null);
  const groups = useInvalidFieldAccordion({
    type: "multiple",
    defaultValue: ["schedule", "outcome", "reopen", "review", "assign", "convert", "reject"]
  });
  const isClosed = status === "CONVERTED" || status === "REJECTED";
  const isFinalOutcome = outcomeStatus === "SUCCESSFUL" || outcomeStatus === "NO_SHOW" || outcomeStatus === "CANCELLED";
  const lifecycleEditable = outcomeStatus === "PENDING" || outcomeStatus === "AWAITING_RESULT";
  const canReview = !isClosed && status !== "PAYMENT_PENDING" && lifecycleEditable;
  const canAssign = canAssignConsultation && !isClosed && lifecycleEditable;
  const canConvert = !isClosed && (outcomeStatus === "AWAITING_RESULT" || outcomeStatus === "SUCCESSFUL");
  const canReject = canManageOutcome && !isClosed && lifecycleEditable;
  const canRecordOutcome = canManageOutcome && (outcomeStatus === "AWAITING_RESULT" || isFinalOutcome);

  async function postJson(path: string, payload: unknown, options: { goToNextReview?: boolean } = {}) {
    setIsBusy(true);
    setMessage(null);

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

      const body = (await response.json().catch(() => ({}))) as ApiSuccessBody;
      setMessage({ tone: "success", text: commonUiCopy.saved });
      if (options.goToNextReview && body.data?.nextReviewHref) {
        router.push(body.data.nextReviewHref);
        return;
      }
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: commonUiCopy.serverUnavailable });
    } finally {
      setIsBusy(false);
    }
  }

  function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    postJson(`/api/admin/consultations/${consultationId}/assign`, {
      assignedLawyerId: formData.get("assignedLawyerId")
    });
  }

  function reject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    postJson(`/api/admin/consultations/${consultationId}/reject`, {
      expectedOutcomeVersion: outcomeVersion,
      reasonCode: formData.get("reasonCode"),
      reason: formData.get("reason")
    });
  }

  function convert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const startsAt = String(formData.get("appointmentStartsAt") || "");
    postJson(`/api/admin/consultations/${consultationId}/convert`, {
      assignedLawyerId: formData.get("assignedLawyerId"),
      caseTitle: formData.get("caseTitle"),
      caseType: formData.get("caseType"),
      priority: formData.get("priority"),
      appointmentStartsAt: startsAt ? new Date(startsAt).toISOString() : "",
      appointmentMode: formData.get("appointmentMode"),
      appointmentLocation: formData.get("appointmentLocation"),
      appointmentDurationMinutes: formData.get("appointmentDurationMinutes")
    });
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    postJson(
      `/api/admin/consultations/${consultationId}/review`,
      {
        note: formData.get("note")
      },
      { goToNextReview: true }
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" value={groups.value} onValueChange={groups.onValueChange}>
        {canSchedule ? (
          <AccordionItem value="schedule" data-form-group="schedule" className="rounded-lg border border-border bg-surface px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex flex-1 flex-col gap-1 text-start">
                <span className="text-base font-semibold text-foreground">{overdueCopy.scheduleForm.title}</span>
                <span className="text-sm font-normal text-muted-foreground">{overdueCopy.scheduleForm.description}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4">
                <ConsultationScheduleForm
                  consultationId={consultationId}
                  lawyers={lawyers}
                  outcomeVersion={outcomeVersion}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {canRecordOutcome ? (
          <AccordionItem value="outcome" data-form-group="outcome" className="rounded-lg border border-border bg-surface px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex flex-1 flex-col gap-1 text-start">
                <span className="text-base font-semibold text-foreground">{isFinalOutcome ? outcomeCopy.outcomeForm.correctionTitle : outcomeCopy.outcomeForm.title}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {isFinalOutcome ? outcomeCopy.outcomeForm.correctionDescription : outcomeCopy.outcomeForm.description}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4">
                <ConsultationOutcomeForm
                  consultationId={consultationId}
                  currentOutcome={outcomeStatus}
                  outcomeVersion={outcomeVersion}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {canReopen ? (
          <AccordionItem value="reopen" data-form-group="reopen" className="rounded-lg border border-border bg-surface px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex flex-1 flex-col gap-1 text-start">
                <span className="text-base font-semibold text-foreground">{outcomeCopy.reopenForm.title}</span>
                <span className="text-sm font-normal text-muted-foreground">{outcomeCopy.reopenForm.description}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4">
                <ConsultationReopenForm
                  consultationId={consultationId}
                  lawyers={lawyers}
                  outcomeVersion={outcomeVersion}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}

      <AccordionItem value="review" data-form-group="review" className="rounded-lg border border-border bg-surface px-4">
        <AccordionTrigger className="hover:no-underline">
          <span className="flex flex-1 flex-col gap-1 text-start">
            <span className="text-base font-semibold text-foreground">مراجعة السكرتيرة</span>
            <span className="text-sm font-normal text-muted-foreground">بعد مراجعة بيانات الطلب، سيختفي من إشعارات الطلبات الجديدة وتنتقل مباشرة للطلب التالي إن وجد.</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          {secretaryReviewedAt ? (
            <InlineFeedback
              className="mb-3"
              title={`تمت المراجعة${secretaryReviewedByName ? ` بواسطة ${secretaryReviewedByName}` : ""}.`}
              tone="info"
            />
          ) : null}
          <form className="space-y-3 pb-4" onSubmit={review} onInvalidCapture={groups.onInvalidCapture}>
            <Textarea defaultValue={secretaryReviewNote ?? ""} disabled={!canReview || isBusy || Boolean(secretaryReviewedAt)} idPrefix={`consultation-review-${consultationId}`} label="ملاحظة مراجعة داخلية" name="note" />
            <StatefulButton
              aria-busy={isBusy}
              className={buttonClasses({ variant: "secondary" })}
              disabled={!canReview || Boolean(secretaryReviewedAt) || isBusy}
              type="submit"
            >
              تمت مراجعة السكرتيرة
            </StatefulButton>
          </form>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="assign" data-form-group="assign" className="rounded-lg border border-border bg-surface px-4">
        <AccordionTrigger className="hover:no-underline">
          <span className="flex flex-1 flex-col gap-1 text-start">
            <span className="text-base font-semibold text-foreground">تعيين المحامي</span>
            <span className="text-sm font-normal text-muted-foreground">التعيين يحول الطلب إلى قيد المراجعة إذا لم يكن مغلقًا.</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <form className="grid gap-3 pb-4 sm:grid-cols-[1fr_auto]" onSubmit={assign} onInvalidCapture={groups.onInvalidCapture}>
            <Select defaultValue={assignedLawyerId ?? ""} disabled={!canAssign || isBusy} idPrefix={`consultation-assign-${consultationId}`} label="المحامي المسؤول" name="assignedLawyerId" required>
              <option value="">اختر محاميًا</option>
              {lawyers.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>
                  {lawyer.name}
                </option>
              ))}
            </Select>
            <StatefulButton
              aria-busy={isBusy}
              className={buttonClasses({ variant: "secondary", className: "self-end" })}
              disabled={!canAssign || isBusy}
              type="submit"
            >
              تعيين
            </StatefulButton>
          </form>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="convert" data-form-group="convert" className="rounded-lg border border-border bg-surface px-4">
        <AccordionTrigger className="hover:no-underline">
          <span className="flex flex-1 flex-col gap-1 text-start">
            <span className="text-base font-semibold text-foreground">تحويل إلى قضية</span>
            <span className="text-sm font-normal text-muted-foreground">ينشئ عميلًا أو يربط العميل الموجود، ثم ينشئ ملف قضية وموعدًا اختياريًا.</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <form ref={convertFormRef} className="grid gap-4 pb-4" onSubmit={convert} onInvalidCapture={groups.onInvalidCapture}>
            <Select defaultValue={assignedLawyerId ?? ""} disabled={!canConvert || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="المحامي المسؤول" name="assignedLawyerId">
              <option value="">استخدم التعيين الحالي</option>
              {lawyers.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>
                  {lawyer.name}
                </option>
              ))}
            </Select>
            <TextInput disabled={!canConvert || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="عنوان القضية" name="caseTitle" placeholder="مثال: مراجعة عقد توريد" />
            <TextInput disabled={!canConvert || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="نوع القضية" name="caseType" placeholder="الشركات والعقود" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select defaultValue="NORMAL" disabled={!canConvert || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="الأولوية" name="priority">
                <option value="LOW">منخفضة</option>
                <option value="NORMAL">عادية</option>
                <option value="HIGH">مرتفعة</option>
                <option value="URGENT">عاجلة</option>
              </Select>
              <Select defaultValue="ONLINE" disabled={!canConvert || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="طريقة الموعد" name="appointmentMode">
                <option value="ONLINE">أونلاين</option>
                <option value="PHONE">هاتف</option>
                <option value="OFFICE">في المكتب</option>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput disabled={!canConvert || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="وقت الموعد" name="appointmentStartsAt" type="datetime-local" />
              <TextInput defaultValue="60" disabled={!canConvert || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="مدة الموعد بالدقائق" name="appointmentDurationMinutes" type="number" />
            </div>
            <TextInput disabled={!canConvert || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="مكان أو رابط الموعد" name="appointmentLocation" />
            <Button disabled={!canConvert || lawyers.length === 0 || isBusy} type="button" onClick={() => setConvertOpen(true)}>
              تحويل إلى قضية
            </Button>
          </form>
          <AdminDialog
            variant="confirm"
            open={convertOpen}
            onOpenChange={setConvertOpen}
            title="تأكيد تحويل الطلب إلى قضية"
            description="سيتم إنشاء عميل أو ربط العميل الموجود، ثم إنشاء ملف قضية وموعد حسب البيانات المدخلة."
            confirmLabel="تأكيد التحويل"
            cancelLabel="إلغاء"
            confirmBusy={isBusy}
            onConfirm={() => {
              setConvertOpen(false);
              convertFormRef.current?.requestSubmit();
            }}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="reject" data-form-group="reject" className="rounded-lg border border-kmt-danger-border bg-kmt-danger-surface px-4">
        <AccordionTrigger className="hover:no-underline">
          <span className="flex flex-1 flex-col gap-1 text-start">
            <span className="text-base font-semibold text-foreground">رفض الطلب</span>
            <span className="text-sm font-normal text-muted-foreground">استخدم الرفض فقط عندما لا يصلح الطلب للتحويل أو يحتاج قناة أخرى.</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <form ref={rejectFormRef} className="space-y-3 pb-4" onSubmit={reject} onInvalidCapture={groups.onInvalidCapture}>
            <Select defaultValue="CANCELLED_BY_OFFICE" disabled={!canReject || isBusy} idPrefix={`consultation-reject-${consultationId}`} label={outcomeCopy.outcomeForm.reason} name="reasonCode" required>
              <option value="CANCELLED_BY_OFFICE">{outcomeCopy.reasons.CANCELLED_BY_OFFICE}</option>
              <option value="CANCELLED_BY_CLIENT">{outcomeCopy.reasons.CANCELLED_BY_CLIENT}</option>
              <option value="OTHER">{outcomeCopy.reasons.OTHER}</option>
            </Select>
            <Textarea disabled={!canReject || isBusy} idPrefix={`consultation-reject-${consultationId}`} label="سبب داخلي مختصر" name="reason" />
            <Button disabled={!canReject || isBusy} type="button" variant="danger" onClick={() => setRejectOpen(true)}>
              رفض الطلب
            </Button>
          </form>
          <AdminDialog
            variant="destructive"
            open={rejectOpen}
            onOpenChange={setRejectOpen}
            title="تأكيد رفض الطلب"
            description="سيتم إغلاق طلب الاستشارة بالسبب المحدد. لا يمكن التراجع عن الرفض من هنا."
            confirmLabel="تأكيد الرفض"
            cancelLabel="إلغاء"
            confirmBusy={isBusy}
            onConfirm={() => {
              setRejectOpen(false);
              rejectFormRef.current?.requestSubmit();
            }}
          />
        </AccordionContent>
      </AccordionItem>
      </Accordion>

      {message ? <InlineFeedback title={message.text} tone={message.tone} /> : null}
    </div>
  );
}
