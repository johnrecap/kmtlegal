import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type KmtBrandLogoVariant = "mark" | "lockup" | "full";
type KmtBrandLogoSurface = "dark" | "light";
type KmtBrandLogoSize = "sm" | "md" | "lg";
type KmtBrandLogoShape = "rounded" | "circle";

const markSizeClasses: Record<KmtBrandLogoSize, string> = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem]"
};

const lockupTextClasses: Record<KmtBrandLogoSize, { kmt: string; legal: string; sublabel: string }> = {
  sm: { kmt: "text-[10px]", legal: "text-base", sublabel: "text-[11px]" },
  md: { kmt: "text-[11px]", legal: "text-xl", sublabel: "text-xs" },
  lg: { kmt: "text-xs", legal: "text-2xl", sublabel: "text-sm" }
};

const fullSizeClasses: Record<KmtBrandLogoSize, string> = {
  sm: "h-20 w-auto",
  md: "h-28 w-auto",
  lg: "h-36 w-auto"
};

export function KmtBrandLogo({
  variant = "lockup",
  surface = "dark",
  size = "md",
  href,
  sublabel,
  className,
  imageClassName,
  shape = "rounded",
  label = "KMT Legal"
}: {
  variant?: KmtBrandLogoVariant;
  surface?: KmtBrandLogoSurface;
  size?: KmtBrandLogoSize;
  href?: string;
  sublabel?: ReactNode;
  className?: string;
  imageClassName?: string;
  shape?: KmtBrandLogoShape;
  label?: string;
}) {
  const content =
    variant === "full" ? (
      <img
        alt={label}
        className={cn("block max-w-full object-contain", fullSizeClasses[size], imageClassName)}
        decoding="async"
        height={890}
        loading="lazy"
        src="/brand/kmt-logo-full.webp"
        width={860}
      />
    ) : variant === "mark" ? (
      <BrandMark alt={label} imageClassName={imageClassName} shape={shape} size={size} surface={surface} />
    ) : (
      <>
        <BrandMark alt="" imageClassName={imageClassName} shape={shape} size={size} surface={surface} />
        <span className="min-w-0">
          <span className={cn("block font-label-sm font-semibold uppercase leading-none tracking-[0.22em] text-kmt-gold", lockupTextClasses[size].kmt)}>KMT</span>
          <span className={cn("block font-semibold leading-tight", surface === "dark" ? "text-[#f8f3ea]" : "text-kmt-ink", lockupTextClasses[size].legal)}>Legal</span>
          {sublabel ? <span className={cn("block truncate font-medium leading-5", surface === "dark" ? "text-stone-400" : "text-kmt-muted", lockupTextClasses[size].sublabel)}>{sublabel}</span> : null}
        </span>
      </>
    );

  const wrapperClassName = cn(
    "inline-flex min-w-0 items-center text-start",
    variant === "lockup" ? "gap-3" : undefined,
    href ? "group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kmt-gold" : undefined,
    className
  );

  if (href) {
    return (
      <Link aria-label={label} className={wrapperClassName} href={href}>
        {content}
      </Link>
    );
  }

  return <span className={wrapperClassName}>{content}</span>;
}

function BrandMark({
  alt,
  imageClassName,
  shape,
  size,
  surface
}: {
  alt: string;
  imageClassName?: string;
  shape: KmtBrandLogoShape;
  size: KmtBrandLogoSize;
  surface: KmtBrandLogoSurface;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden border bg-black text-kmt-gold shadow-[0_0_26px_rgba(153,123,68,0.18)]",
        markSizeClasses[size],
        shape === "circle" ? "rounded-full" : "rounded-lg",
        surface === "dark" ? "border-kmt-gold/45" : "border-kmt-gold/30"
      )}
    >
      <img
        alt={alt}
        className={cn("block h-full w-full object-cover", imageClassName)}
        decoding="async"
        height={512}
        loading="lazy"
        src="/brand/kmt-logo-mark.webp"
        width={512}
      />
    </span>
  );
}
