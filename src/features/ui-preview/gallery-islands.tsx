"use client";

import { Button, Dialog } from "@/components/ui";
import { useState } from "react";
import { CountUp } from "@/components/motion-ui/count-up";
import { ShimmerButton } from "@/components/motion-ui/shimmer-button";

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={() => setOpen(true)} variant="secondary">
        Open dialog
      </Button>
      <Dialog
        description="Escape, backdrop click, and Tab cycling are handled. Focus returns to the opener on close."
        footer={
          <>
            <Button onClick={() => setOpen(false)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
          </>
        }
        onClose={() => setOpen(false)}
        open={open}
        title="Confirm this action"
      >
        <p className="text-sm leading-6 text-muted-foreground">
          This dialog demonstrates the shared Dialog primitive: native <code className="rounded bg-surface-muted px-1 py-0.5">&lt;dialog&gt;</code>,
          focus trap, Escape to close, and scroll lock while open.
        </p>
      </Dialog>
    </div>
  );
}

export function ShimmerDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ShimmerButton>Book a consultation</ShimmerButton>
      <Button loading>Submitting</Button>
    </div>
  );
}

export function CountUpDemo() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm font-medium text-muted-foreground">Open matters</p>
        <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
          <CountUp value={24} />
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm font-medium text-muted-foreground">Recovery rate</p>
        <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
          <CountUp format={(n) => `${Math.round(n)}%`} value={92} />
        </p>
      </div>
    </div>
  );
}
