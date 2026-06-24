import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MaterialSymbol } from "./material-symbol";

type ToastTone = "success" | "warning" | "error" | "info";

const toneClasses: Record<ToastTone, string> = {
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900"
};

const iconNames: Record<ToastTone, string> = {
  success: "check_circle",
  warning: "warning",
  error: "error",
  info: "info"
};

export function Toast({
  tone = "info",
  title,
  description,
  action,
  className
}: {
  tone?: ToastTone;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex max-w-xl items-start gap-3 rounded-lg border p-4 shadow-kmt-popover", toneClasses[tone], className)} role="status">
      <MaterialSymbol className="mt-0.5 text-[20px]" name={iconNames[tone]} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {description ? <p className="mt-1 text-sm leading-6 opacity-80">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
