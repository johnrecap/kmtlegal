"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#f8fafc", color: "#0f172a" }}>
          <section style={{ width: "min(100%, 42rem)", border: "1px solid #e2e8f0", background: "white", padding: "2rem" }}>
            <p style={{ color: "#997b44", fontWeight: 700 }}>KMT Legal</p>
            <h1 style={{ marginTop: "1rem", fontSize: "2rem" }}>تعذر إكمال الطلب</h1>
            <p style={{ marginTop: "0.75rem", lineHeight: 1.8 }}>حدث خطأ غير متوقع. لم تتغير بياناتك، ويمكنك إعادة المحاولة بأمان.</p>
            <button type="button" onClick={reset} style={{ marginTop: "1.5rem", minHeight: "44px", border: 0, background: "#997b44", color: "white", padding: "0.7rem 1.2rem", fontWeight: 700, cursor: "pointer" }}>
              إعادة المحاولة
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
