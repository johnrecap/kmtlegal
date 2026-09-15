"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
};

export function SpotlightCard({ children, className, spotlightColor }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cn("kmt-spotlight relative overflow-hidden", className)}
      style={spotlightColor ? ({ "--kmt-spotlight-color": spotlightColor } as CSSProperties) : undefined}
      onMouseMove={(event) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--kmt-spotlight-x", `${event.clientX - rect.left}px`);
        el.style.setProperty("--kmt-spotlight-y", `${event.clientY - rect.top}px`);
      }}
    >
      {children}
    </div>
  );
}
