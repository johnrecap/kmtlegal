"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { alternativeTimeCopy } from "@/content/booking-policy-copy";
import { formatDateTime } from "@/lib/legal-format";
export function RequestAlternativeTime({ id, mode, version, locale }: { id: string; mode: string; version: number; locale: "ar" | "en" }) {
  const copy = alternativeTimeCopy[locale]; const router = useRouter(); const [slots, setSlots] = useState<Array<{ startsAt: string }>>([]); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  async function load() { setBusy(true); setNotice(""); try { const response = await fetch(`/api/public/consultations/slots?mode=${mode}`, { cache: "no-store" }); if (!response.ok) throw new Error(); const result = await response.json(); const values = result.data.slots; setSlots(values); if (!values.length) setNotice(copy.empty); } catch { setNotice(copy.failed); } finally { setBusy(false); } }
  async function choose(startsAt: string) { setBusy(true); try { const response = await fetch(`/api/client/requests/${id}/alternative`, { method: "POST", headers: { "Content-Type": "application/json", "x-kmt-locale": locale }, body: JSON.stringify({ startsAt, mode, version }) }); if (!response.ok) throw new Error(); setSlots([]); setNotice(copy.saved); router.refresh(); } catch { setNotice(copy.failed); } finally { setBusy(false); } }
  return <div className="mt-4 space-y-3"><Button disabled={busy} onClick={() => void load()}>{copy.title}</Button>{slots.length > 0 && <label className="block">{copy.choose}<select className="min-h-11 w-full min-w-0 rounded border border-border bg-surface p-2" value="" disabled={busy} onChange={e => { if (e.target.value) void choose(e.target.value); }}><option value="">{copy.choose}</option>{slots.map(slot => <option value={slot.startsAt} key={slot.startsAt}>{formatDateTime(slot.startsAt, locale)}</option>)}</select></label>}{notice && <p role="status">{notice}</p>}</div>;
}
