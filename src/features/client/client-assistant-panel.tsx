"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
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
import { ClientTeamChatPanel } from "./client-team-chat-panel";

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
  tone?: "default" | "error";
  data?: AssistantResponse;
};

type ApiBody = {
  data?: AssistantResponse;
  error?: {
    message?: string;
  };
};

const assistantCopy = {
  title: "المساعد التنظيمي",
  description: "اسأل عن البيانات التنظيمية الظاهرة في حسابك فقط: المواعيد، الجلسات، القضايا، المستندات، والمدفوعات.",
  assistantName: "KMT Client Assistant",
  status: "تنظيم فقط",
  scope: "بيانات حسابك فقط. بدون رأي قانوني.",
  placeholder: "مثال: موعد جلستي إمتى؟",
  inputLabel: "رسالتك",
  send: "إرسال",
  talkToTeam: "التحدث مع الفريق",
  typing: "المساعد يراجع بيانات حسابك",
  noData: "لا توجد بيانات ظاهرة لهذا السؤال الآن.",
  requestError: "تعذر تنفيذ الطلب الآن.",
  networkError: "لا يمكن الوصول إلى الخادم الآن.",
  initialMessage:
    "أنا مساعد تنظيمي داخل بوابة العميل. أستطيع عرض المواعيد، جلسات القضايا، القضايا، المستندات المرئية، والمدفوعات الظاهرة في حسابك فقط. لا أقدم رأيًا قانونيًا."
} as const;

const quickPrompts = [
  { label: "مواعيدي القادمة", message: "ما هي مواعيدي القادمة؟", icon: "event" },
  { label: "جلسات القضايا", message: "ما هي جلسات القضايا الظاهرة لي؟", icon: "gavel" },
  { label: "قضاياي", message: "ما هي القضايا المفتوحة في حسابي؟", icon: "folder_open" },
  { label: "مستنداتي", message: "هل توجد مستندات جديدة أو مرئية لي؟", icon: "description" },
  { label: "مدفوعاتي", message: "ما هي المدفوعات الظاهرة في بوابتي؟", icon: "payments" }
] as const;

const initialAssistantMessage: ChatMessage = {
  id: "initial",
  role: "assistant",
  text: assistantCopy.initialMessage
};

async function parseAssistantResponse(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ApiBody;
  if (!response.ok) {
    return { error: body.error?.message ?? assistantCopy.requestError };
  }
  return { data: body.data };
}

export function ClientAssistantPanel() {
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const [surface, setSurface] = useState<"assistant" | "team">("assistant");
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isBusy]);

  function appendAssistantError(text: string) {
    setMessages((current) => [...current, { id: `assistant-error-${Date.now()}`, role: "assistant", text, tone: "error" }]);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

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
        appendAssistantError(result.error);
        return;
      }
      const data = result.data ?? {};
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: data.message ?? assistantCopy.noData,
          data
        }
      ]);
    } catch {
      appendAssistantError(assistantCopy.networkError);
    } finally {
      setIsBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(message);
  }

  if (surface === "team") {
    return <ClientTeamChatPanel onBack={() => setSurface("assistant")} />;
  }

  return (
    <ClientPortalPanel description={assistantCopy.description} title={assistantCopy.title}>
      <div
        className="overflow-hidden rounded-lg border border-kmt-gold/20 bg-[linear-gradient(145deg,#17110a_0%,#0b0c0e_52%,#050505_100%)]"
        data-testid="client-assistant-shell"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/25 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-kmt-gold/35 bg-kmt-gold/15 text-kmt-gold">
              <MaterialSymbol className="text-2xl" name="support_agent" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{assistantCopy.assistantName}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-kmt-gold">{assistantCopy.status}</p>
            </div>
          </div>
          <p className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs leading-5 text-slate-300">{assistantCopy.scope}</p>
        </header>

        <div className="border-b border-white/10 bg-black/15 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {quickPrompts.map((prompt) => (
              <Button
                key={prompt.message}
                className={cn(clientPortalSecondaryActionClass, "min-h-9 shrink-0 rounded-full border-kmt-gold/25 bg-white/[0.03] px-3 text-sm text-amber-100 hover:bg-kmt-gold hover:text-[#120d07]")}
                disabled={isBusy}
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => sendMessage(prompt.message)}
              >
                <MaterialSymbol className="text-base" name={prompt.icon} />
                {prompt.label}
              </Button>
            ))}
            <Button
              className={cn(clientPortalSecondaryActionClass, "min-h-9 shrink-0 rounded-full border-kmt-gold/35 bg-kmt-gold/12 px-3 text-sm text-amber-100 hover:bg-kmt-gold hover:text-[#120d07]")}
              disabled={isBusy}
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setSurface("team")}
            >
              <MaterialSymbol className="text-base" name="forum" />
              {assistantCopy.talkToTeam}
            </Button>
          </div>
        </div>

        <div aria-busy={isBusy ? "true" : "false"} className="max-h-[36rem] space-y-4 overflow-y-auto px-4 py-5" data-testid="client-assistant-log" role="log">
          {messages.map((item) => (
            <ClientChatBubble key={item.id} item={item} />
          ))}
          {isBusy ? <TypingIndicator label={assistantCopy.typing} /> : null}
          <div ref={logEndRef} />
        </div>

        <form className="flex items-end gap-2 border-t border-white/10 bg-black/35 px-4 py-4" data-testid="client-assistant-composer" onSubmit={submit}>
          <div className="min-w-0 flex-1 [&_label]:sr-only">
            <Textarea
              className="min-h-12 resize-none rounded-2xl border-kmt-gold/25 bg-black/35 py-3 text-white placeholder:text-amber-100/45 focus:border-kmt-gold focus:ring-kmt-gold/25"
              label={assistantCopy.inputLabel}
              name="message"
              placeholder={assistantCopy.placeholder}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />
          </div>
          <Button
            aria-label={assistantCopy.send}
            className={cn(clientPortalPrimaryActionClass, "h-12 w-12 shrink-0 rounded-full px-0")}
            disabled={!message.trim()}
            loading={isBusy}
            type="submit"
          >
            <MaterialSymbol className="text-xl" name="send" />
            <span className="sr-only">{assistantCopy.send}</span>
          </Button>
        </form>
      </div>
    </ClientPortalPanel>
  );
}

function ClientChatBubble({ item }: { item: ChatMessage }) {
  const isUser = item.role === "user";

  return (
    <div className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-kmt-gold/25 bg-kmt-gold/10 text-kmt-gold">
          <MaterialSymbol className="text-lg" name={item.tone === "error" ? "error" : "support_agent"} />
        </span>
      ) : null}
      <div
        className={cn(
          "max-w-[92%] break-words rounded-2xl px-4 py-3 text-sm leading-7 shadow-[0_16px_42px_-34px_rgba(0,0,0,0.95)]",
          isUser ? "rounded-ee-sm bg-kmt-gold text-[#120d07]" : "rounded-es-sm border border-white/10 bg-white/[0.05] text-slate-100",
          item.tone === "error" ? "border-red-300/35 bg-red-950/45 text-red-100" : undefined
        )}
        role={item.tone === "error" ? "alert" : undefined}
      >
        <p>{item.text}</p>
        {item.data?.disclaimer ? <p className="mt-2 border-t border-white/10 pt-2 text-xs text-amber-100">{item.data.disclaimer}</p> : null}
        <AssistantData response={item.data} />
      </div>
    </div>
  );
}

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-end gap-2 text-slate-300">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-kmt-gold/25 bg-kmt-gold/10 text-kmt-gold">
        <MaterialSymbol className="text-lg" name="support_agent" />
      </span>
      <div className="flex items-center gap-2 rounded-2xl rounded-es-sm border border-white/10 bg-white/[0.05] px-4 py-3 text-xs">
        <span>{label}</span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kmt-gold" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kmt-gold [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kmt-gold [animation-delay:240ms]" />
        </span>
      </div>
    </div>
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
