"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { paymentLedgerCopy } from "@/content/payment-ledger-copy";
import { cairoLocalDateTimeToIso } from "@/lib/legal-format";

export function PaymentEntryForm({ paymentId, currency, entries }: { paymentId: string; currency: string; entries: Array<{ id: string; receiptNumber: string; amount: string; kind: string; reversed: boolean }> }) {
  const copy = paymentLedgerCopy.ar;
  const router = useRouter();
  const key = useRef<string | null>(null);
  const [kind, setKind] = useState("SETTLEMENT");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const occurredAt = cairoLocalDateTimeToIso(String(values.get("occurredAt")));
    if (!occurredAt) { setNotice(copy.failed); return; }
    key.current ??= crypto.randomUUID();
    setBusy(true); setNotice("");
    try {
      const response = await fetch(`/api/admin/finance/${paymentId}/entries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        idempotencyKey: key.current, kind, currency, amount: String(values.get("amount")),
        receiptNumber: String(values.get("receiptNumber")), method: String(values.get("method")), occurredAt,
        ...(kind === "REVERSAL" ? { reversesEntryId: String(values.get("reversesEntryId")) } : {}),
        ...(kind !== "SETTLEMENT" ? { reason: String(values.get("reason")) } : {})
      }) });
      if (!response.ok) { setNotice(copy.failed); return; }
      key.current = null; form.reset(); setKind("SETTLEMENT"); setNotice(copy.saved); router.refresh();
    } catch { setNotice(copy.failed); }
    finally { setBusy(false); }
  }
  const field = "min-h-11 w-full rounded border border-input bg-surface px-3 text-foreground";
  return <form className="mt-5 grid gap-4" onSubmit={submit}>
    <h3 className="font-semibold">{copy.add}</h3>
    <label>{copy.kind}<select className={field} value={kind} onChange={event => { setKind(event.target.value); key.current = null; }} disabled={busy}>{(["SETTLEMENT", "REFUND", "REVERSAL"] as const).map(value => <option key={value} value={value}>{copy.kinds[value]}</option>)}</select></label>
    <label>{copy.amount} ({currency})<input className={field} name="amount" inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" required disabled={busy} /></label>
    <label>{copy.method}<select className={field} name="method" disabled={busy}>{(["CASH", "BANK_TRANSFER"] as const).map(value => <option key={value} value={value}>{copy.methods[value]}</option>)}</select></label>
    <label>{copy.receipt}<input className={field} name="receiptNumber" maxLength={80} required disabled={busy} /></label>
    <label>{copy.occurredAt}<input className={field} name="occurredAt" type="datetime-local" required disabled={busy} /></label>
    {kind === "REVERSAL" && <label>{copy.original}<select className={field} name="reversesEntryId" required disabled={busy}>{entries.filter(entry => entry.kind !== "REVERSAL" && !entry.reversed).map(entry => <option key={entry.id} value={entry.id}>{entry.receiptNumber} · {entry.amount}</option>)}</select></label>}
    {kind !== "SETTLEMENT" && <label>{copy.reason}<textarea className={field} name="reason" minLength={3} maxLength={500} required disabled={busy} /></label>}
    <Button type="submit" disabled={busy}>{copy.save}</Button>
    {notice && <p role="status" className="text-sm">{notice}</p>}
  </form>;
}
