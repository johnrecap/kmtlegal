"use client";

import { MaterialSymbol } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";

export function ReceiptPrintButton({ label }: { label: string }) {
  return (
    <button className={buttonClasses({ variant: "primary", size: "md", className: "min-h-11" })} type="button" onClick={() => window.print()}>
      <MaterialSymbol name="receipt_long" />
      <span>{label}</span>
    </button>
  );
}
