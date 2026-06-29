"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { KmtBrandLogo } from "@/components/brand";
import { ClientPortalPanel, clientPortalPrimaryActionClass, clientPortalSecondaryActionClass } from "@/components/layout";
import { Badge, Button, MaterialSymbol, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { conversationStatusLabels, formatDateTime, labelFrom } from "@/lib/legal-format";

type TeamMessage = {
  id: string;
  senderType: "CLIENT" | "STAFF" | "SYSTEM";
  body: string;
  createdAt: string;
  senderUser: { id: string; name: string } | null;
};

type TeamThread = {
  id: string;
  status: string;
  subject: string | null;
  lastMessageAt: string;
  messages: TeamMessage[];
};

type ListBody = {
  data?: {
    items: TeamThread[];
  };
  error?: { message?: string };
};

type DetailBody = {
  data?: TeamThread;
  error?: { message?: string };
};

const teamCopy = {
  title: "التواصل مع الفريق",
  description: "رسائل مباشرة بينك وبين السكرتيرة أو فريق المكتب. هذه المحادثة محفوظة لأنها تواصل بشري داخل البوابة.",
  assistantName: "KMT Team Chat",
  status: "تواصل مباشر",
  scope: "الفريق يرد عليك داخل البوابة فقط.",
  placeholder: "اكتب رسالتك للفريق...",
  inputLabel: "رسالتك للفريق",
  send: "إرسال",
  start: "ابدأ محادثة مع الفريق",
  back: "رجوع للمساعد",
  loading: "جاري تحميل رسائل الفريق...",
  empty: "اكتب أول رسالة للفريق بخصوص الموعد أو المتابعة أو أي تنظيم مطلوب.",
  closed: "هذه المحادثة مغلقة. إرسال رسالة جديدة سيبدأ محادثة جديدة.",
  requestError: "تعذر تنفيذ الطلب الآن.",
  networkError: "لا يمكن الوصول إلى الخادم الآن.",
  privacy: "لا تشارك مستندات حساسة هنا إلا إذا طلب الفريق ذلك من خلال قناة آمنة."
} as const;

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? teamCopy.requestError);
  }
  return payload;
}

function statusTone(status?: string) {
  if (status === "WAITING_STAFF") {
    return "pending" as const;
  }
  if (status === "OPEN" || status === "WAITING_CLIENT") {
    return "active" as const;
  }
  if (status === "CLOSED" || status === "ARCHIVED") {
    return "closed" as const;
  }
  return "neutral" as const;
}

export function ClientTeamChatPanel({ onBack }: { onBack: () => void }) {
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const [thread, setThread] = useState<TeamThread | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isClosed = thread?.status === "CLOSED" || thread?.status === "ARCHIVED";
  const messages = useMemo(() => thread?.messages ?? [], [thread?.messages]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/client/messages", { cache: "no-store" });
        const payload = await readJson<ListBody>(response);
        const latest = payload.data?.items?.[0];
        if (!latest) {
          if (mounted) {
            setThread(null);
          }
          return;
        }
        const detailResponse = await fetch(`/api/client/messages/${latest.id}`, { cache: "no-store" });
        const detailPayload = await readJson<DetailBody>(detailResponse);
        if (mounted) {
          setThread(detailPayload.data ?? null);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : teamCopy.networkError);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!thread?.id || isClosed) {
      return;
    }
    let mounted = true;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/client/messages/${thread.id}`, { cache: "no-store" });
        const payload = await readJson<DetailBody>(response);
        if (mounted && payload.data) {
          setThread(payload.data);
        }
      } catch {
        if (mounted) {
          setError("تعذر تحديث محادثة الفريق الآن.");
        }
      }
    }, 5000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [thread?.id, isClosed]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isSending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const endpoint = thread?.id && !isClosed ? `/api/client/messages/${thread.id}/messages` : "/api/client/messages";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(thread?.id && !isClosed ? { message: trimmed } : { message: trimmed, subject: "Client team chat" })
      });
      const payload = await readJson<DetailBody>(response);
      setThread(payload.data ?? null);
      setMessage("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : teamCopy.networkError);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <ClientPortalPanel description={teamCopy.description} title={teamCopy.title}>
      <div className="overflow-hidden rounded-[1.35rem] border border-kmt-gold/35 bg-[radial-gradient(circle_at_top_left,rgba(183,134,64,0.14),transparent_34%),linear-gradient(145deg,#17110a_0%,#090b0d_52%,#050505_100%)] shadow-[0_30px_100px_-58px_rgba(183,134,64,0.5)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/25 px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <KmtBrandLogo label={teamCopy.assistantName} shape="circle" size="md" variant="mark" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">{teamCopy.assistantName}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-kmt-gold">{teamCopy.status}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {thread ? <Badge tone={statusTone(thread.status)}>{labelFrom(conversationStatusLabels, thread.status)}</Badge> : null}
            <Button className={cn(clientPortalSecondaryActionClass, "min-h-9 rounded-full border-kmt-gold/25 px-3 text-sm text-amber-100")} size="sm" type="button" variant="secondary" onClick={onBack}>
              <MaterialSymbol className="text-base" name="arrow_back" />
              {teamCopy.back}
            </Button>
          </div>
        </header>

        <div className="border-b border-white/10 bg-black/15 px-5 py-3 text-sm leading-7 text-slate-300">
          {isClosed ? teamCopy.closed : teamCopy.scope}
        </div>

        <div aria-busy={isLoading || isSending ? "true" : "false"} className="max-h-[34rem] min-h-[26rem] space-y-4 overflow-y-auto px-5 py-5" role="log">
          {isLoading ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-300">{teamCopy.loading}</p>
          ) : messages.length ? (
            messages.map((item) => <TeamBubble key={item.id} item={item} />)
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-7 text-slate-300">{teamCopy.empty}</p>
          )}
          {isSending ? <TeamTyping /> : null}
          <div ref={logEndRef} />
        </div>

        <form className="border-t border-white/10 bg-black/35 px-5 py-5" onSubmit={submit}>
          {error ? <p className="mb-3 rounded border border-red-300/30 bg-red-950/45 px-3 py-2 text-sm text-red-100">{error}</p> : null}
          <div className="flex min-w-0 items-end gap-3">
            <div className="min-w-0 flex-1 [&_label]:sr-only">
              <Textarea
                className="min-h-14 resize-none rounded-2xl border-kmt-gold/35 bg-black/35 py-3 text-white placeholder:text-amber-100/45 focus:border-kmt-gold focus:ring-kmt-gold/25"
                label={teamCopy.inputLabel}
                name="teamMessage"
                placeholder={teamCopy.placeholder}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={2000}
                required
              />
            </div>
            <Button
              aria-label={teamCopy.send}
              className={cn(clientPortalPrimaryActionClass, "h-14 w-14 shrink-0 rounded-full px-0")}
              disabled={!message.trim() || isLoading}
              loading={isSending}
              type="submit"
            >
              <MaterialSymbol className="text-xl" name="send" />
              <span className="sr-only">{teamCopy.send}</span>
            </Button>
          </div>
          <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-amber-100/70">
            <MaterialSymbol className="text-base" name="lock" />
            {teamCopy.privacy}
          </p>
        </form>
      </div>
    </ClientPortalPanel>
  );
}

function TeamBubble({ item }: { item: TeamMessage }) {
  const isClient = item.senderType === "CLIENT";
  return (
    <div className={cn("flex items-end gap-3", isClient ? "justify-end" : "justify-start")}>
      {!isClient ? <KmtBrandLogo label="" shape="circle" size="sm" variant="mark" /> : null}
      <div
        className={cn(
          "max-w-[86%] break-words rounded-2xl px-4 py-3 text-sm leading-7 shadow-[0_16px_42px_-34px_rgba(0,0,0,0.95)]",
          isClient ? "rounded-ee-sm bg-kmt-gold text-[#120d07]" : "rounded-es-sm border border-white/10 bg-white/[0.05] text-slate-100"
        )}
      >
        <p className="whitespace-pre-wrap">{item.body}</p>
        <p className={cn("mt-2 text-xs", isClient ? "text-black/60" : "text-slate-400")}>
          {item.senderUser?.name ?? (isClient ? "أنت" : "الفريق")} · {formatDateTime(item.createdAt)}
        </p>
      </div>
    </div>
  );
}

function TeamTyping() {
  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-1 rounded-2xl bg-kmt-gold px-4 py-3" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:240ms]" />
      </div>
    </div>
  );
}
