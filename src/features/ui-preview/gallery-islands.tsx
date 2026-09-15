"use client";

import { Button, Dialog } from "@/components/ui";
import { useState } from "react";
import { CountUp } from "@/components/motion-ui/count-up";
import { ShimmerButton } from "@/components/motion-ui/shimmer-button";
import { RippleButton, RippleButtonRipples } from "@/components/animate-ui/ripple-button";
import { SplittingText } from "@/components/animate-ui/splitting-text";
import { Tilt, TiltContent } from "@/components/animate-ui/tilt";

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

export function AnimateUiDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
        <p className="text-sm font-semibold">Ripple button</p>
        <p className="text-sm leading-6 text-muted-foreground">animate-ui ripple primitive on a primary button.</p>
        <RippleButton
          className="inline-flex min-h-11 items-center justify-center rounded border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground"
          hoverScale={1.02}
          tapScale={0.97}
          type="button"
        >
          Click me
          <RippleButtonRipples color="rgb(29 22 12 / 22%)" />
        </RippleButton>
      </div>
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm font-semibold">Tilt card</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Move the cursor — the card tilts in 3D (spring-smoothed, reduced-motion safe).</p>
        <div className="mt-4">
          <Tilt maxTilt={8}>
            <TiltContent className="rounded-lg border border-border bg-surface-muted p-4">
              <p className="text-sm font-medium">Tilted content</p>
              <p className="mt-1 text-xs text-muted-foreground">perspective 800 · maxTilt 8°</p>
            </TiltContent>
          </Tilt>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm font-semibold">Splitting text</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Word-level entrance (line-level is used for Arabic headlines).</p>
        <p className="mt-4 text-xl font-semibold">
          <SplittingText initial={{ y: 24, opacity: 0 }} text="Structured Legal Support" transition={{ duration: 0.6, ease: "easeOut" }} type="words" />
        </p>
      </div>
    </div>
  );
}
