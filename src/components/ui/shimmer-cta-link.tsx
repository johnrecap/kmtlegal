import Link from "next/link";
import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ShimmerCtaLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  children?: ReactNode;
}

/**
 * Link-rooted adaptation of the Magic UI Shimmer Button
 * (`src/components/ui/shimmer-button.tsx`, same spark / highlight /
 * backdrop implementation and keyframes). Conversion CTAs in this project
 * are links, and a `<button>` root cannot carry an href — the shimmer
 * implementation itself is unchanged.
 */
export function ShimmerCtaLink({
  href,
  shimmerColor = "rgb(255 236 188 / 85%)",
  shimmerSize = "0.05em",
  shimmerDuration = "3s",
  borderRadius = "6px",
  background,
  className,
  children,
  ...props
}: ShimmerCtaLinkProps) {
  return (
    <Link
      href={href}
      style={
        {
          "--spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--radius": borderRadius,
          "--speed": shimmerDuration,
          "--cut": shimmerSize,
          "--bg": background ?? "var(--primary)"
        } as CSSProperties
      }
      className={cn(
        "group relative z-0 inline-flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap [background:var(--bg)] [border-radius:var(--radius)]",
        "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
        className
      )}
      {...props}
    >
      {/* spark container */}
      <div className={cn("-z-30 blur-[2px]", "[container-type:size] absolute inset-0 overflow-visible")}>
        {/* spark */}
        <div className="animate-shimmer-slide absolute inset-0 aspect-[1] h-[100cqh] rounded-none [mask:none]">
          {/* spark before */}
          <div className="animate-spin-around absolute -inset-full w-auto [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0] rotate-0" />
        </div>
      </div>
      {children}

      {/* Highlight */}
      <div
        className={cn(
          "absolute inset-0 size-full",
          "px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f] [border-radius:var(--radius)]",
          "transform-gpu transition-all duration-300 ease-in-out",
          "group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]",
          "group-active:shadow-[inset_0_-10px_10px_#ffffff3f]"
        )}
      />

      {/* backdrop */}
      <div className={cn("absolute inset-[var(--cut)] -z-20 [background:var(--bg)] [border-radius:var(--radius)]")} />
    </Link>
  );
}
