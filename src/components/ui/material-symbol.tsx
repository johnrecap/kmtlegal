import { cn } from "@/lib/cn";

type MaterialSymbolProps = {
  name: string;
  className?: string;
  filled?: boolean;
  "aria-hidden"?: boolean;
};

export function MaterialSymbol({
  name,
  className,
  filled = false,
  "aria-hidden": ariaHidden = true
}: MaterialSymbolProps) {
  return (
    <span
      aria-hidden={ariaHidden}
      className={cn("material-symbols-outlined notranslate inline-flex h-[1em] w-[1em] shrink-0 select-none overflow-hidden align-middle leading-none", className)}
      style={{ fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" 24` }}
    >
      {name}
    </span>
  );
}
