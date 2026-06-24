"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button, Select, StateBlock, TextInput, Textarea } from "@/components/ui";
import { currencyValues, paymentStatusValues } from "@/lib/legal-finance";
import { labelFrom, paymentStatusLabels } from "@/lib/legal-format";

type ClientOption = {
  id: string;
  fullName: string;
  phone?: string | null;
};

type CaseOption = {
  id: string;
  internalFileNumber: string;
  title: string;
  clientId: string;
  client?: {
    id: string;
    fullName: string;
  };
};

type PaymentValue = {
  id?: string;
  invoiceNumber?: string;
  clientId?: string;
  caseId?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  amount?: string | number | null;
  currency?: string;
  status?: string;
  paymentMethod?: string | null;
  receiptNumber?: string | null;
  paidAt?: string | null;
  notes?: string | null;
};

type ApiErrorBody = {
  error?: {
    message?: string;
  };
};

async function readMessage(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  return body.error?.message ?? "تعذر تنفيذ الإجراء الآن.";
}

function toDateInput(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function toDateTimeInput(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoFromLocalDateTime(value: FormDataEntryValue | null) {
  const raw = String(value || "");
  return raw ? new Date(raw).toISOString() : "";
}

function paymentPayloadFromForm(form: HTMLFormElement) {
  const formData = new FormData(form);

  return {
    invoiceNumber: formData.get("invoiceNumber"),
    clientId: formData.get("clientId"),
    caseId: formData.get("caseId"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    status: formData.get("status"),
    paymentMethod: formData.get("paymentMethod"),
    receiptNumber: formData.get("receiptNumber"),
    paidAt: toIsoFromLocalDateTime(formData.get("paidAt")),
    notes: formData.get("notes")
  };
}

async function sendJson(path: string, method: "POST" | "PATCH", payload: unknown) {
  return fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

function StatusMessage({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-900" role="status">
      {message}
    </div>
  );
}

export function PaymentForm({
  clients,
  cases,
  payment,
  mode = "create"
}: {
  clients: ClientOption[];
  cases: CaseOption[];
  payment?: PaymentValue;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const isEdit = mode === "edit" && payment?.id;

  if (clients.length === 0) {
    return <StateBlock title="لا توجد ملفات عملاء" description="إضافة فاتورة يدوية تحتاج ملف عميل نشط داخل CRM." />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await sendJson(
        isEdit ? `/api/admin/finance/${payment.id}` : "/api/admin/finance",
        isEdit ? "PATCH" : "POST",
        paymentPayloadFromForm(event.currentTarget)
      );

      if (!response.ok) {
        setMessage(await readMessage(response));
        return;
      }

      if (!isEdit) {
        event.currentTarget.reset();
      }

      setMessage(isEdit ? "تم حفظ الفاتورة." : "تم إنشاء الفاتورة.");
      router.refresh();
    } catch {
      setMessage("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <TextInput
        defaultValue={payment?.invoiceNumber ?? ""}
        disabled={isBusy}
        label="رقم الفاتورة"
        name="invoiceNumber"
        placeholder="INV-2026-0002"
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue={payment?.clientId ?? ""} disabled={isBusy} label="العميل" name="clientId" required>
          <option value="">اختر العميل</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.fullName}
            </option>
          ))}
        </Select>
        <Select defaultValue={payment?.caseId ?? ""} disabled={isBusy} label="القضية" name="caseId">
          <option value="">بدون قضية</option>
          {cases.map((legalCase) => (
            <option key={legalCase.id} value={legalCase.id}>
              {legalCase.internalFileNumber} - {legalCase.title} ({legalCase.client?.fullName ?? "عميل"})
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          defaultValue={toDateInput(payment?.issueDate) || todayInput()}
          disabled={isBusy}
          label="تاريخ الإصدار"
          name="issueDate"
          required
          type="date"
        />
        <TextInput defaultValue={toDateInput(payment?.dueDate)} disabled={isBusy} label="تاريخ الاستحقاق" name="dueDate" type="date" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput
          defaultValue={payment?.amount ? String(payment.amount) : ""}
          disabled={isBusy}
          inputMode="decimal"
          label="القيمة"
          min="0.01"
          name="amount"
          required
          step="0.01"
          type="number"
        />
        <Select defaultValue={payment?.currency ?? "EGP"} disabled={isBusy} label="العملة" name="currency">
          {currencyValues.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </Select>
        <Select defaultValue={payment?.status ?? "DRAFT"} disabled={isBusy} label="الحالة" name="status">
          {paymentStatusValues.map((status) => (
            <option key={status} value={status}>
              {labelFrom(paymentStatusLabels, status)}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput defaultValue={payment?.paymentMethod ?? ""} disabled={isBusy} label="طريقة الدفع" name="paymentMethod" />
        <TextInput defaultValue={payment?.receiptNumber ?? ""} disabled={isBusy} label="رقم الإيصال" name="receiptNumber" />
      </div>
      <TextInput
        defaultValue={toDateTimeInput(payment?.paidAt)}
        disabled={isBusy}
        hint="يقبل هذا الحقل فقط عندما تكون الحالة مدفوعة."
        label="تاريخ الدفع"
        name="paidAt"
        type="datetime-local"
      />
      <Textarea defaultValue={payment?.notes ?? ""} disabled={isBusy} label="ملاحظات داخلية" name="notes" />
      <Button loading={isBusy} type="submit">
        {isEdit ? "حفظ الفاتورة" : "إنشاء فاتورة"}
      </Button>
      <StatusMessage message={message} />
    </form>
  );
}
