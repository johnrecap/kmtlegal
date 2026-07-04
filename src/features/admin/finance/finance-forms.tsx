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

type PaymentProviderOption = {
  provider: "paytabs" | "paymob";
  label: string;
  configured: boolean;
  missing: string[];
  checkoutMode: string;
  active: boolean;
};

export type PaymentGatewaySettingsValue = {
  activeProvider: "paytabs" | "paymob";
  bookingMode: "AI_CHAT_PAID" | "AI_CHAT_FREE";
  paymentEnabled: boolean;
  aiChatEnabled: boolean;
  hasActivePricingRule: boolean;
  readyForPaidChat: boolean;
  providers: PaymentProviderOption[];
};

export type PricingRuleValue = {
  id?: string;
  serviceCategory?: string | null;
  mode?: string | null;
  amount?: string | number | null;
  currency?: string;
  active?: boolean;
  effectiveFrom?: string | null;
  version?: number;
  label?: string | null;
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

function pricingPayloadFromForm(form: HTMLFormElement) {
  const formData = new FormData(form);

  return {
    serviceCategory: formData.get("serviceCategory"),
    mode: formData.get("mode"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    active: formData.get("active") === "on",
    effectiveFrom: toIsoFromLocalDateTime(formData.get("effectiveFrom")),
    version: formData.get("version"),
    label: formData.get("label")
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
    const form = event.currentTarget;
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await sendJson(
        isEdit ? `/api/admin/finance/${payment.id}` : "/api/admin/finance",
        isEdit ? "PATCH" : "POST",
        paymentPayloadFromForm(form)
      );

      if (!response.ok) {
        setMessage(await readMessage(response));
        return;
      }

      if (!isEdit) {
        form.reset();
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
      {isEdit ? (
        <TextInput
          defaultValue={payment?.invoiceNumber ?? ""}
          disabled={isBusy}
          label="رقم الفاتورة"
          name="invoiceNumber"
          placeholder="INV-2026-0002"
          required
        />
      ) : (
        <div className="space-y-2">
          <span className="block text-sm font-semibold text-kmt-ink">رقم الفاتورة</span>
          <input name="invoiceNumber" type="hidden" value="" />
          <div className="flex min-h-11 items-center rounded border border-slate-300 bg-slate-50 px-3 py-2.5 text-base text-kmt-muted">
            سيتم توليده تلقائيًا عند إنشاء الفاتورة
          </div>
          <p className="text-sm leading-6 text-kmt-muted">يستخدم تاريخ الإصدار لترقيم الفاتورة بصيغة INV-YYYY-0001.</p>
        </div>
      )}
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

export function PaymentGatewaySettingsForm({ settings }: { settings: PaymentGatewaySettingsValue }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [activeProvider, setActiveProvider] = useState(settings.activeProvider);
  const [bookingMode, setBookingMode] = useState(settings.bookingMode);
  const selectedProvider = settings.providers.find((provider) => provider.provider === activeProvider) ?? settings.providers[0];
  const paidChatReady = Boolean(selectedProvider?.configured && settings.hasActivePricingRule);
  const blocksPaidChatSave = bookingMode === "AI_CHAT_PAID" && !paidChatReady;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await sendJson("/api/admin/payments/settings", "PATCH", {
        activeProvider: formData.get("activeProvider"),
        bookingMode: formData.get("bookingMode")
      });

      if (!response.ok) {
        setMessage(await readMessage(response));
        return;
      }

      setMessage("تم حفظ إعدادات الحجز والدفع.");
      router.refresh();
    } catch {
      setMessage("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Select
        disabled={isBusy}
        label="وضع استقبال طلب الاستشارة"
        name="bookingMode"
        value={bookingMode}
        onChange={(event) => setBookingMode(event.target.value as PaymentGatewaySettingsValue["bookingMode"])}
      >
        <option value="AI_CHAT_PAID">شات AI + دفع رسوم الحجز</option>
        <option value="AI_CHAT_FREE">شات AI بدون رسوم حجز</option>
      </Select>
      <div className="rounded border border-kmt-border bg-white px-3 py-2 text-sm leading-6">
        <p className="font-semibold text-kmt-ink">
          {bookingMode === "AI_CHAT_PAID" ? "الشات والدفع مفعلان للحجوزات الجديدة." : "الشات مفعل، وسيتم تأكيد الموعد من المحادثة بدون تحصيل رسوم حجز."}
        </p>
        <p className="mt-1 text-xs text-kmt-muted">
          {bookingMode === "AI_CHAT_PAID"
            ? "يتطلب هذا الوضع بوابة دفع جاهزة وسعر استشارة نشط قبل الحفظ."
            : "لا يشترط هذا الوضع وجود سعر استشارة أو إعدادات بوابة دفع، لكن نص طلب العميل سيظل ظاهرًا للسكرتيرة للمراجعة والتوزيع."}
        </p>
      </div>
      <Select
        disabled={isBusy}
        label="بوابة الدفع النشطة"
        name="activeProvider"
        value={activeProvider}
        onChange={(event) => setActiveProvider(event.target.value as PaymentGatewaySettingsValue["activeProvider"])}
      >
        {settings.providers.map((provider) => (
          <option key={provider.provider} value={provider.provider}>
            {provider.label}
          </option>
        ))}
      </Select>
      <div className="grid gap-2">
        {settings.providers.map((provider) => (
          <div key={provider.provider} className="rounded border border-kmt-border bg-white px-3 py-2 text-sm leading-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-kmt-ink">{provider.label}</span>
              <span className={provider.configured ? "text-emerald-700" : "text-amber-700"}>
                {provider.configured ? "جاهزة" : "ناقص إعدادات"}
              </span>
            </div>
            <p className="mt-1 text-xs text-kmt-muted">
              {provider.configured ? `وضع التشغيل: ${provider.checkoutMode}` : `المطلوب: ${provider.missing.join(", ")}`}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded border border-kmt-border bg-white px-3 py-2 text-sm leading-6">
        <p className={settings.hasActivePricingRule ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
          {settings.hasActivePricingRule ? "يوجد سعر استشارة نشط." : "لا يوجد سعر استشارة نشط."}
        </p>
        <p className="mt-1 text-xs text-kmt-muted">
          {selectedProvider?.configured ? `${selectedProvider.label} جاهزة للتفعيل.` : `${selectedProvider?.label ?? "بوابة الدفع"} ناقصة إعدادات.`}
        </p>
      </div>
      {blocksPaidChatSave ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900" role="alert">
          لا يمكن تفعيل شات الحجز مع الدفع قبل تجهيز بوابة الدفع المختارة وإنشاء سعر استشارة نشط.
        </div>
      ) : null}
      <Button disabled={blocksPaidChatSave || isBusy} loading={isBusy} type="submit">
        حفظ إعدادات الحجز والدفع
      </Button>
      <StatusMessage message={message} />
    </form>
  );
}

export function ConsultationPricingRuleForm({
  pricingRule
}: {
  pricingRule?: PricingRuleValue;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const isEdit = Boolean(pricingRule?.id);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await sendJson(
        isEdit ? `/api/admin/payments/pricing/${pricingRule?.id}` : "/api/admin/payments/pricing",
        isEdit ? "PATCH" : "POST",
        pricingPayloadFromForm(form)
      );

      if (!response.ok) {
        setMessage(await readMessage(response));
        return;
      }

      if (!isEdit) {
        form.reset();
      }

      setMessage(isEdit ? "تم حفظ سعر الاستشارة." : "تم إنشاء سعر الاستشارة.");
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
        defaultValue={pricingRule?.label ?? ""}
        disabled={isBusy}
        label="اسم السعر الداخلي"
        name="label"
        placeholder="عربون استشارة عامة"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          defaultValue={pricingRule?.serviceCategory ?? ""}
          disabled={isBusy}
          label="تصنيف الخدمة"
          name="serviceCategory"
          placeholder="اتركه فارغًا لسعر عام"
        />
        <Select defaultValue={pricingRule?.mode ?? ""} disabled={isBusy} label="طريقة الاستشارة" name="mode">
          <option value="">كل الطرق</option>
          <option value="PHONE">هاتف</option>
          <option value="ONLINE">أونلاين</option>
          <option value="OFFICE">في المكتب</option>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput
          defaultValue={pricingRule?.amount ? String(pricingRule.amount) : ""}
          disabled={isBusy}
          inputMode="decimal"
          label="قيمة الحجز"
          min="0.01"
          name="amount"
          required
          step="0.01"
          type="number"
        />
        <Select defaultValue={pricingRule?.currency ?? "EGP"} disabled={isBusy} label="العملة" name="currency">
          {currencyValues.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </Select>
        <TextInput
          defaultValue={String(pricingRule?.version ?? 1)}
          disabled={isBusy}
          label="الإصدار"
          min="1"
          name="version"
          required
          type="number"
        />
      </div>
      <TextInput
        defaultValue={toDateTimeInput(pricingRule?.effectiveFrom) || toDateTimeInput(new Date().toISOString())}
        disabled={isBusy}
        label="يبدأ من"
        name="effectiveFrom"
        required
        type="datetime-local"
      />
      <label className="flex items-center gap-3 rounded border border-kmt-border bg-white px-3 py-2 text-sm font-semibold text-kmt-ink">
        <input className="h-4 w-4 accent-kmt-navy" defaultChecked={pricingRule?.active ?? true} disabled={isBusy} name="active" type="checkbox" />
        <span>سعر نشط</span>
      </label>
      <Button loading={isBusy} type="submit">
        {isEdit ? "حفظ سعر الاستشارة" : "إنشاء سعر استشارة"}
      </Button>
      <StatusMessage message={message} />
    </form>
  );
}
