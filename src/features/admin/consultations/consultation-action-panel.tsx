"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, InlineFeedback, Select, Textarea, TextInput } from "@/components/ui";

type LawyerOption = {
  id: string;
  name: string;
  email: string;
};

type ApiErrorBody = {
  error?: {
    message?: string;
  };
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
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  return body.error?.message ?? "تعذر تنفيذ الإجراء الآن.";
}

export function ConsultationActionPanel({
  consultationId,
  status,
  assignedLawyerId,
  secretaryReviewedAt,
  secretaryReviewedByName,
  secretaryReviewNote,
  lawyers
}: {
  consultationId: string;
  status: string;
  assignedLawyerId?: string | null;
  secretaryReviewedAt?: string | null;
  secretaryReviewedByName?: string | null;
  secretaryReviewNote?: string | null;
  lawyers: LawyerOption[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const isClosed = status === "CONVERTED" || status === "REJECTED";
  const canReview = !isClosed && status !== "PAYMENT_PENDING";

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
      setMessage({ tone: "success", text: "تم حفظ الإجراء بنجاح." });
      if (options.goToNextReview && body.data?.nextReviewHref) {
        router.push(body.data.nextReviewHref);
        return;
      }
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
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
      <Card>
        <CardHeader>
          <CardTitle>مراجعة السكرتيرة</CardTitle>
          <CardDescription>بعد مراجعة بيانات الطلب، سيختفي من إشعارات الطلبات الجديدة وتنتقل مباشرة للطلب التالي إن وجد.</CardDescription>
        </CardHeader>
        <CardContent>
          {secretaryReviewedAt ? (
            <InlineFeedback
              className="mb-3"
              title={`تمت المراجعة${secretaryReviewedByName ? ` بواسطة ${secretaryReviewedByName}` : ""}.`}
              tone="info"
            />
          ) : null}
          <form className="space-y-3" onSubmit={review}>
            <Textarea defaultValue={secretaryReviewNote ?? ""} disabled={!canReview || isBusy || Boolean(secretaryReviewedAt)} idPrefix={`consultation-review-${consultationId}`} label="ملاحظة مراجعة داخلية" name="note" />
            <Button disabled={!canReview || Boolean(secretaryReviewedAt)} loading={isBusy} type="submit" variant="secondary">
              تمت مراجعة السكرتيرة
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تعيين المحامي</CardTitle>
          <CardDescription>التعيين يحول الطلب إلى قيد المراجعة إذا لم يكن مغلقًا.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={assign}>
            <Select defaultValue={assignedLawyerId ?? ""} disabled={isClosed || isBusy} idPrefix={`consultation-assign-${consultationId}`} label="المحامي المسؤول" name="assignedLawyerId" required>
              <option value="">اختر محاميًا</option>
              {lawyers.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>
                  {lawyer.name}
                </option>
              ))}
            </Select>
            <Button className="self-end" disabled={isClosed} loading={isBusy} type="submit" variant="secondary">
              تعيين
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تحويل إلى قضية</CardTitle>
          <CardDescription>ينشئ عميلًا أو يربط العميل الموجود، ثم ينشئ ملف قضية وموعدًا اختياريًا.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={convert}>
            <Select defaultValue={assignedLawyerId ?? ""} disabled={isClosed || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="المحامي المسؤول" name="assignedLawyerId">
              <option value="">استخدم التعيين الحالي</option>
              {lawyers.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>
                  {lawyer.name}
                </option>
              ))}
            </Select>
            <TextInput disabled={isClosed || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="عنوان القضية" name="caseTitle" placeholder="مثال: مراجعة عقد توريد" />
            <TextInput disabled={isClosed || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="نوع القضية" name="caseType" placeholder="الشركات والعقود" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select defaultValue="NORMAL" disabled={isClosed || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="الأولوية" name="priority">
                <option value="LOW">منخفضة</option>
                <option value="NORMAL">عادية</option>
                <option value="HIGH">مرتفعة</option>
                <option value="URGENT">عاجلة</option>
              </Select>
              <Select defaultValue="ONLINE" disabled={isClosed || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="طريقة الموعد" name="appointmentMode">
                <option value="ONLINE">أونلاين</option>
                <option value="PHONE">هاتف</option>
                <option value="OFFICE">في المكتب</option>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput disabled={isClosed || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="وقت الموعد" name="appointmentStartsAt" type="datetime-local" />
              <TextInput defaultValue="60" disabled={isClosed || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="مدة الموعد بالدقائق" name="appointmentDurationMinutes" type="number" />
            </div>
            <TextInput disabled={isClosed || isBusy} idPrefix={`consultation-convert-${consultationId}`} label="مكان أو رابط الموعد" name="appointmentLocation" />
            <Button disabled={isClosed || lawyers.length === 0} loading={isBusy} type="submit">
              تحويل إلى قضية
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>رفض الطلب</CardTitle>
          <CardDescription>استخدم الرفض فقط عندما لا يصلح الطلب للتحويل أو يحتاج قناة أخرى.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={reject}>
            <Textarea disabled={isClosed || isBusy} idPrefix={`consultation-reject-${consultationId}`} label="سبب داخلي مختصر" name="reason" />
            <Button disabled={isClosed} loading={isBusy} type="submit" variant="danger">
              رفض الطلب
            </Button>
          </form>
        </CardContent>
      </Card>

      {message ? <InlineFeedback title={message.text} tone={message.tone} /> : null}
    </div>
  );
}
