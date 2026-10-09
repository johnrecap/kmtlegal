"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { paymentLedgerCopy } from "@/content/payment-ledger-copy";
export function PaymentProofForm({ paymentId, locale }: { paymentId: string; locale: "ar" | "en" }) {
  const copy = paymentLedgerCopy[locale]; const router = useRouter(); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  async function upload(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); data.set("paymentId", paymentId); data.set("category", "PAYMENT"); setBusy(true); setNotice(""); try { const response = await fetch("/api/files/upload", { method: "POST", body: data }); if (!response.ok) throw new Error(); setNotice(copy.proofSaved); router.refresh(); } catch { setNotice(copy.proofFailed); } finally { setBusy(false); } }
  return <details className="min-w-0 rounded-lg border border-border bg-surface p-4"><summary className="min-h-11 cursor-pointer py-2">{copy.uploadProof}</summary><form onSubmit={upload} className="space-y-3"><p className="text-sm">{copy.proof}</p><label className="block">{copy.uploadProof}<input className="min-h-11 w-full min-w-0 max-w-full text-sm" required type="file" name="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={busy} /></label><Button type="submit" disabled={busy}>{copy.uploadProof}</Button>{notice && <p role="status">{notice}</p>}</form></details>;
}
