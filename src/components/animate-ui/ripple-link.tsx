"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * animate-ui ripple pattern (https://animate-ui.com) adapted for next/link so
 * primary link CTAs get the same tap ripple as RippleButton. Hover lift stays
 * CSS-driven (token transitions); the ripple overlay is the only JS effect.
 */
type RippleLinkProps = React.ComponentProps<typeof Link> & {
  rippleColor?: string;
};

function RippleLink({ children, className, onClick, rippleColor = "rgb(29 22 12 / 22%)", ...props }: RippleLinkProps) {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
  const linkRef = React.useRef<HTMLAnchorElement>(null);
  const reducedMotion = useReducedMotion();

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!reducedMotion && linkRef.current) {
        const rect = linkRef.current.getBoundingClientRect();
        const ripple = { id: Date.now(), x: event.clientX - rect.left, y: event.clientY - rect.top };
        setRipples((prev) => [...prev, ripple]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
        }, 600);
      }
      onClick?.(event);
    },
    [onClick, reducedMotion]
  );

  return (
    <Link
      ref={linkRef}
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          aria-hidden="true"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 10, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: "absolute",
            borderRadius: "50%",
            pointerEvents: "none",
            width: "20px",
            height: "20px",
            backgroundColor: rippleColor,
            top: ripple.y - 10,
            left: ripple.x - 10
          }}
        />
      ))}
    </Link>
  );
}

export { RippleLink, type RippleLinkProps };
