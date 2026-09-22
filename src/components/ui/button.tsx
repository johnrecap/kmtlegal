import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-primary-foreground hover:bg-accent hover:border-accent active:bg-accent active:border-accent",
  secondary:
    "border-border bg-surface text-foreground hover:bg-surface-muted active:bg-surface-muted",
  outline:
    "border-primary/60 bg-transparent text-accent hover:bg-primary/10 active:bg-primary/15",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-surface-muted",
  danger: "border-danger bg-danger text-white hover:border-danger-strong hover:bg-danger-strong"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-11 px-4 text-base",
  lg: "min-h-12 px-5 text-base"
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded border font-medium transition-colors duration-kmt-fast ease-kmt-out motion-reduce:transition-none",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:cursor-not-allowed disabled:opacity-55",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    leadingIcon,
    trailingIcon,
    loading = false,
    disabled,
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" /> : leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </button>
  );
});

export type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  external?: boolean;
};

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { className, href, variant = "primary", size = "md", leadingIcon, trailingIcon, external = false, children, ...props },
  ref
) {
  const classes = buttonClasses({ variant, size, className });
  if (external) {
    return (
      <a ref={ref} className={classes} href={href} rel="noopener noreferrer" target="_blank" {...props}>
        {leadingIcon}
        <span>{children}</span>
        {trailingIcon}
      </a>
    );
  }
  return (
    <Link ref={ref} className={classes} href={href} {...props}>
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </Link>
  );
});
