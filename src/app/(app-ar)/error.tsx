"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button, StateBlock } from "@/components/ui";
import { protectedRecoveryUiCopy as copy } from "@/lib/ui-copy";

export default function ProtectedError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-kmt-canvas px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <StateBlock tone="error" title={copy.errorTitle} description={copy.errorDescription} />
        <Button className="mt-4" type="button" onClick={reset}>
          {copy.retry}
        </Button>
      </div>
    </main>
  );
}
