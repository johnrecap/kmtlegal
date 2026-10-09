"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { conversationCopy } from "@/content/conversation-copy";

export function ClientEmailVerification() {
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const copy = conversationCopy[locale];
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    setToken(params.get("token") ?? "");
    setLocale(params.get("locale") === "en" ? "en" : "ar");
    // The token never reaches server access logs, referrers or the assistant transcript.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function submit() {
    if (password !== confirmPassword) { setNotice(copy.passwordMismatch); return; }
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/public/client-account/verify", { method: "POST", headers: { "Content-Type": "application/json", "x-kmt-locale": locale }, body: JSON.stringify({ token, password, confirmPassword }) });
      if (!response.ok) { setNotice(response.status === 410 ? copy.invalidToken : copy.unavailable); return; }
      setDone(true); setPassword(""); setConfirmPassword(""); setToken("");
    } catch { setNotice(copy.unavailable); }
    finally { setBusy(false); }
  }
  return <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto my-12 w-[calc(100%-2rem)] max-w-md space-y-5 rounded-xl border border-kmt-gold/30 bg-surface p-6 text-foreground">
    <h1 className="font-display text-2xl">{copy.verify}</h1>
    {done ? <p role="status">{copy.verified}</p> : <form onSubmit={event => { event.preventDefault(); void submit(); }} className="space-y-4">
      {!token && <p>{copy.invalidToken}</p>}
      <label className="block space-y-2"><span>{copy.password}</span><input type="password" autoComplete="new-password" minLength={10} maxLength={256} required value={password} onChange={event => setPassword(event.target.value)} className="min-h-11 w-full rounded border border-border bg-transparent px-3" /></label>
      <label className="block space-y-2"><span>{copy.confirmPassword}</span><input type="password" autoComplete="new-password" minLength={10} maxLength={256} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="min-h-11 w-full rounded border border-border bg-transparent px-3" /></label>
      <Button type="submit" disabled={busy || !token}>{copy.activate}</Button>
    </form>}
    {notice && <p role="status">{notice}</p>}
    <Link href={locale === "ar" ? "/ar/book-consultation" : "/book-consultation"} className="flex min-h-11 items-center underline">{copy.back}</Link>
  </main>;
}
