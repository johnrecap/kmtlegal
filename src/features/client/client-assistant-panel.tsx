"use client";

import { type FormEvent, useState } from "react";
import { ClientPortalPanel, ClientPortalRow, clientPortalPrimaryActionClass, clientPortalSecondaryActionClass } from "@/components/layout";
import { Badge, Button, MaterialSymbol, Textarea } from "@/components/ui";
import {
  appointmentStatusLabels,
  caseStatusLabels,
  documentCategoryLabels,
  documentStatusLabels,
  formatBytes,
  formatDate,
  formatDateTime,
  formatMoney,
  labelFrom,
  modeLabels,
  paymentStatusLabels,
  priorityLabels
} from "@/lib/legal-format";
import { cn } from "@/lib/cn";

type AssistantAppointment = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
  mode: string;
  lawyer?: { name: string } | null;
  case?: { title: string; internalFileNumber: string } | null;
};

type AssistantCase = {
  id: string;
  internalFileNumber: string;
  title: string;
  status: string;
  priority: string;
  nextSessionAt: string | null;
  assignedLawyer?: { name: string } | null;
};

type AssistantSession = {
  id: string;
  courtName: string | null;
  sessionDate: string;
  decision: string | null;
  nextSessionDate: string | null;
  case: { title: string; internalFileNumber: string };
};

type AssistantDocument = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  status: string;
  createdAt: string;
  case?: { title: string; internalFileNumber: string } | null;
};

type AssistantPayment = {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
  case?: { title: string; internalFileNumber: string } | null;
};

type AssistantResponse = {
  action?: string;
  message?: string;
  disclaimer?: string;
  appointments?: AssistantAppointment[];
  cases?: AssistantCase[];
  sessions?: AssistantSession[];
  documents?: AssistantDocument[];
  payments?: AssistantPayment[];
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  data?: AssistantResponse;
};

type ApiBody = {
  data?: AssistantResponse;
  error?: {
    message?: string;
  };
};

const quickPrompts = [
  { label: "مواعيدي القادمة", message: "ما هي مواعيدي القادمة؟", icon: "event" },
  { label: "جلسات القضايا", message: "ما هي جلسات القضايا الظاهرة لي؟", icon: "gavel" },
  { label: "قضاياتي", message: "ما هي القضايا المفتوحة في حسابي؟", icon: "folder_open" },
  { label: "مستنداتي", message: "هل توجد مستندات جديدة أو مرئية لي؟", icon: "description" },
  { label: "مدفوعاتي", message: "ما هي المدفوعات الظاهرة في بوابتي؟", icon: "payments" }
] as const;

const initialAssistantMessage: ChatMessage = {
  id: "initial",
  role: "assistant",
  text: "أنا مساعد تنظيمي داخل بوابة العميل. أستطيع عرض المواعيد، جلسات القضايا، القضايا، المستندات المرئية، والمدفوعات الظاهرة في حسابك فقط. لا أقدم رأيًا قانونيًا."
};

async function parseAssistantResponse(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ApiBody;
  if (!response.ok) {
    return { error: body.error?.message ?? "تعذر تنفيذ الطلب الآن." };
  }
  return { data: body.data };
}

export function ClientAssistantPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    setError(null);
    setMessage("");
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setIsBusy(true);

    try {
      const response = await fetch("/api/client/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: "ar",
          message: trimmed
        })
      });
      const result = await parseAssistantResponse(response);
      if (result.error) {
        setError(result.error);
        return;
      }
      const data = result.data ?? {};
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: data.message ?? "لا توجد بيانات ظاهرة لهذا السؤال الآن.",
          data
        }
      ]);
    } catch {
      setError("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(message);
  }

  return (
    <ClientPortalPanel
      description="اسأل عن البيانات التنظيمية الظاهرة في حسابك فقط: المواعيد، الجلسات، القضايا، المستندات، والمدفوعات."
      title="المساعد التنظيمي"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <Button
              key={prompt.message}
              className={cn(clientPortalSecondaryActionClass, "min-h-10 gap-2")}
              disabled={isBusy}
              type="button"
              variant="secondary"
              onClick={() => sendMessage(prompt.message)}
            >
              <MaterialSymbol className="text-base" name={prompt.icon} />
              {prompt.label}
            </Button>
          ))}
        </div>

        <div className="max-h-[34rem] space-y-3 overflow-y-auto rounded border border-white/10 bg-black/20 p-3" role="log">
          {messages.map((item) => (
            <div key={item.id} className={cn("flex", item.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[92%] rounded px-3 py-2 text-sm leading-7",
                  item.role === "user" ? "bg-kmt-gold text-white" : "border border-white/10 bg-white/[0.04] text-slate-100"
                )}
              >
                <p>{item.text}</p>
                {item.data?.disclaimer ? <p className="mt-2 border-t border-white/10 pt-2 text-xs text-amber-100">{item.data.disclaimer}</p> : null}
                <AssistantData response={item.data} />
              </div>
            </div>
          ))}
        </div>

        <form className="space-y-3" onSubmit={submit}>
          <Textarea
            label="رسالتك"
            name="message"
            placeholder="مثال: موعد جلستي إمتى؟"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
          />
          <Button className={clientPortalPrimaryActionClass} disabled={!message.trim()} loading={isBusy} type="submit">
            إرسال
          </Button>
        </form>

        {error ? (
          <div className="rounded border border-red-300/35 bg-red-950/50 px-3 py-2 text-sm leading-6 text-red-100" role="alert">
            {error}
          </div>
        ) : null}
      </div>
    </ClientPortalPanel>
  );
}

function AssistantData({ response }: { response?: AssistantResponse }) {
  if (!response) return null;

  return (
    <div className="mt-3 space-y-2">
      {response.appointments?.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)}
      {response.sessions?.map((session) => <SessionCard key={session.id} session={session} />)}
      {response.cases?.map((legalCase) => <CaseCard key={legalCase.id} legalCase={legalCase} />)}
      {response.documents?.map((document) => <DocumentCard key={document.id} document={document} />)}
      {response.payments?.map((payment) => <PaymentCard key={payment.id} payment={payment} />)}
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: AssistantAppointment }) {
  return (
    <ClientPortalRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-white">{appointment.title}</p>
        <Badge tone="pending">{labelFrom(appointmentStatusLabels, appointment.status)}</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-300">{formatDateTime(appointment.startsAt)}</p>
      <p className="mt-1 text-xs text-slate-400">
        {labelFrom(modeLabels, appointment.mode)} · {appointment.lawyer?.name ?? "غير محدد"}
      </p>
      {appointment.case ? <p className="mt-1 text-xs text-amber-100">{appointment.case.internalFileNumber} · {appointment.case.title}</p> : null}
    </ClientPortalRow>
  );
}

function SessionCard({ session }: { session: AssistantSession }) {
  return (
    <ClientPortalRow>
      <p className="font-semibold text-white">{session.case.internalFileNumber} · {session.case.title}</p>
      <p className="mt-1 text-sm text-slate-300">{formatDateTime(session.sessionDate)}</p>
      <p className="mt-1 text-xs text-slate-400">{session.courtName ?? "محكمة غير محددة"}</p>
      {session.nextSessionDate ? <p className="mt-1 text-xs text-amber-100">الجلسة التالية: {formatDateTime(session.nextSessionDate)}</p> : null}
      {session.decision ? <p className="mt-1 text-xs text-slate-300">قرار الجلسة: {session.decision}</p> : null}
    </ClientPortalRow>
  );
}

function CaseCard({ legalCase }: { legalCase: AssistantCase }) {
  return (
    <ClientPortalRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-white">{legalCase.internalFileNumber} · {legalCase.title}</p>
        <Badge tone="active">{labelFrom(caseStatusLabels, legalCase.status)}</Badge>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        الأولوية: {labelFrom(priorityLabels, legalCase.priority)} · المحامي: {legalCase.assignedLawyer?.name ?? "غير محدد"}
      </p>
      <p className="mt-1 text-xs text-amber-100">الجلسة القادمة: {formatDateTime(legalCase.nextSessionAt)}</p>
    </ClientPortalRow>
  );
}

function DocumentCard({ document }: { document: AssistantDocument }) {
  return (
    <ClientPortalRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-white">{document.fileName}</p>
        <Badge tone="pending">{labelFrom(documentStatusLabels, document.status)}</Badge>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {labelFrom(documentCategoryLabels, document.category)} · {formatBytes(document.fileSize)} · {formatDate(document.createdAt)}
      </p>
      {document.case ? <p className="mt-1 text-xs text-amber-100">{document.case.internalFileNumber} · {document.case.title}</p> : null}
    </ClientPortalRow>
  );
}

function PaymentCard({ payment }: { payment: AssistantPayment }) {
  return (
    <ClientPortalRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-white">{payment.invoiceNumber}</p>
        <Badge tone="pending">{labelFrom(paymentStatusLabels, payment.status)}</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-300">{formatMoney(payment.amount, payment.currency)}</p>
      <p className="mt-1 text-xs text-slate-400">
        تاريخ الإصدار: {formatDate(payment.issueDate)} · الاستحقاق: {formatDate(payment.dueDate)}
      </p>
      {payment.case ? <p className="mt-1 text-xs text-amber-100">{payment.case.internalFileNumber} · {payment.case.title}</p> : null}
    </ClientPortalRow>
  );
}
