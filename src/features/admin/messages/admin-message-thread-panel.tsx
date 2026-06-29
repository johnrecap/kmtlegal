"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge, Button, MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";
import { conversationStatusLabels, formatDateTime, labelFrom } from "@/lib/legal-format";

type ConversationMessage = {
  id: string;
  senderType: "CLIENT" | "STAFF" | "SYSTEM";
  body: string;
  createdAt: string | Date;
  senderUser: { id: string; name: string } | null;
};

type ConversationThread = {
  id: string;
  status: string;
  subject: string | null;
  client: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
  };
  assignedTo: { id: string; name: string; email: string } | null;
  lastMessageAt: string | Date;
  closedAt: string | Date | null;
  messages: ConversationMessage[];
};

type ConversationAssignee = {
  id: string;
  name: string;
  email: string;
  role: { name: string };
};

async function readJson(response: Response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "حدث خطأ أثناء تنفيذ الطلب.");
  }
  return payload;
}

function statusTone(status: string) {
  if (status === "WAITING_STAFF") {
    return "pending" as const;
  }
  if (status === "WAITING_CLIENT" || status === "OPEN") {
    return "active" as const;
  }
  if (status === "CLOSED" || status === "ARCHIVED") {
    return "closed" as const;
  }
  return "neutral" as const;
}

export function AdminMessageThreadPanel({
  initialThread,
  assignees,
  canAssign,
  canManage,
  canReply
}: {
  initialThread: ConversationThread;
  assignees: ConversationAssignee[];
  canAssign: boolean;
  canManage: boolean;
  canReply: boolean;
}) {
  const [thread, setThread] = useState(initialThread);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isClosed = thread.status === "CLOSED" || thread.status === "ARCHIVED";

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const response = await fetch(`/api/admin/messages/${thread.id}`, { cache: "no-store" });
        const payload = await readJson(response);
        if (mounted) {
          setThread(payload.data);
        }
      } catch {
        if (mounted) {
          setError("تعذر تحديث المحادثة الآن.");
        }
      }
    };
    const timer = window.setInterval(poll, 5000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [thread.id]);

  const messages = useMemo(() => thread.messages ?? [], [thread.messages]);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isSending || !canReply || isClosed) {
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/messages/${thread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed })
      });
      const payload = await readJson(response);
      setThread(payload.data);
      setMessage("");
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : "تعذر إرسال الرد.");
    } finally {
      setIsSending(false);
    }
  }

  async function updateThread(body: { status?: string; assignedToId?: string | null }) {
    setIsUpdating(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/messages/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await readJson(response);
      setThread(payload.data);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "تعذر تحديث المحادثة.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="min-w-0 overflow-hidden rounded-lg border border-kmt-border bg-white shadow-sm shadow-slate-200/50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-kmt-border px-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-kmt-gold">محادثة مباشرة</p>
            <h2 className="break-words text-xl font-semibold text-kmt-ink">{thread.client.fullName}</h2>
            <p className="mt-1 break-words text-sm text-kmt-muted">{thread.subject ?? "محادثة مع فريق المكتب"}</p>
          </div>
          <Badge tone={statusTone(thread.status)}>{labelFrom(conversationStatusLabels, thread.status)}</Badge>
        </div>

        <div className="max-h-[36rem] min-h-[28rem] space-y-4 overflow-y-auto bg-kmt-canvas/70 p-4">
          {messages.length ? (
            messages.map((item) => {
              const isStaff = item.senderType === "STAFF";
              return (
                <div key={item.id} className={cn("flex gap-3", isStaff ? "justify-end" : "justify-start")}>
                  {!isStaff ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-kmt-gold/30 bg-white text-kmt-gold">
                      <MaterialSymbol className="text-[19px]" name="person" />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm",
                      isStaff ? "rounded-br-md bg-kmt-navy text-white" : "rounded-bl-md border border-kmt-border bg-white text-kmt-ink"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{item.body}</p>
                    <p className={cn("mt-2 text-xs", isStaff ? "text-white/70" : "text-kmt-muted")}>
                      {item.senderUser?.name ?? (isStaff ? "الفريق" : thread.client.fullName)} · {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  {isStaff ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kmt-gold text-white">
                      <MaterialSymbol className="text-[19px]" name="support_agent" />
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="flex min-h-60 items-center justify-center rounded-lg border border-dashed border-kmt-border bg-white text-sm text-kmt-muted">
              لا توجد رسائل في هذه المحادثة بعد.
            </div>
          )}
        </div>

        <form className="border-t border-kmt-border bg-white p-4" onSubmit={sendReply}>
          {error ? <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
          <div className="flex min-w-0 gap-3">
            <textarea
              className="min-h-20 min-w-0 flex-1 resize-y rounded border border-kmt-border bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-kmt-gold"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={isClosed ? "المحادثة مغلقة." : "اكتب رد الفريق للعميل..."}
              disabled={!canReply || isClosed || isSending}
              maxLength={2000}
            />
            <Button className="self-end" type="submit" loading={isSending} disabled={!message.trim() || !canReply || isClosed}>
              إرسال
            </Button>
          </div>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border border-kmt-border bg-white p-4 shadow-sm shadow-slate-200/50">
          <h3 className="text-base font-semibold text-kmt-ink">بيانات العميل</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-kmt-muted">الهاتف</dt>
              <dd className="mt-1 text-kmt-ink" dir="ltr">{thread.client.phone}</dd>
            </div>
            <div>
              <dt className="font-semibold text-kmt-muted">البريد</dt>
              <dd className="mt-1 break-words text-kmt-ink" dir="ltr">{thread.client.email ?? "غير محدد"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-kmt-muted">آخر رسالة</dt>
              <dd className="mt-1 text-kmt-ink">{formatDateTime(thread.lastMessageAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-kmt-border bg-white p-4 shadow-sm shadow-slate-200/50">
          <h3 className="text-base font-semibold text-kmt-ink">إدارة المحادثة</h3>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-kmt-muted">
              المسؤول
              <select
                className="mt-2 min-h-11 w-full rounded border border-kmt-border bg-white px-3 text-kmt-ink outline-none focus:border-kmt-gold"
                value={thread.assignedTo?.id ?? ""}
                disabled={!canAssign || isUpdating}
                onChange={(event) => updateThread({ assignedToId: event.target.value || null })}
              >
                <option value="">غير معين</option>
                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name} - {assignee.role.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-kmt-muted">
              الحالة
              <select
                className="mt-2 min-h-11 w-full rounded border border-kmt-border bg-white px-3 text-kmt-ink outline-none focus:border-kmt-gold"
                value={thread.status}
                disabled={!canManage || isUpdating}
                onChange={(event) => updateThread({ status: event.target.value })}
              >
                {Object.entries(conversationStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {isUpdating ? <p className="text-sm text-kmt-muted">جاري تحديث المحادثة...</p> : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
