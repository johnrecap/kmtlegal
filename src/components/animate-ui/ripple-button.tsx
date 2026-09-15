"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

import { getStrictContext } from "./get-strict-context";

/**
 * Vendored from animate-ui (https://animate-ui.com) — MIT, Skyleen.
 * Source: apps/www/registry/primitives/buttons/ripple/index.tsx
 * Local adaptation: asChild/Slot support removed; prefers-reduced-motion
 * disables the ripple and scale feedback.
 */
type Ripple = {
  id: number;
  x: number;
  y: number;
};

type RippleButtonContextType = {
  ripples: Ripple[];
  setRipples: (ripples: Ripple[]) => void;
};

const [RippleButtonProvider, useRippleButton] = getStrictContext<RippleButtonContextType>("RippleButtonContext");

type RippleButtonProps = HTMLMotionProps<"button"> & {
  hoverScale?: number;
  tapScale?: number;
};

function RippleButton({
  ref,
  onClick,
  hoverScale = 1.05,
  tapScale = 0.95,
  style,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = React.useState<Ripple[]>([]);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  React.useImperativeHandle(ref as React.Ref<HTMLButtonElement> | undefined, () => buttonRef.current as HTMLButtonElement);
  const reducedMotion = useReducedMotion();

  const createRipple = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (reducedMotion) return;
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newRipple: Ripple = {
        id: Date.now(),
        x,
        y
      };

      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
    },
    [reducedMotion]
  );

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(event);
      if (onClick) {
        onClick(event);
      }
    },
    [createRipple, onClick]
  );

  return (
    <RippleButtonProvider value={{ ripples, setRipples }}>
      <motion.button
        ref={buttonRef}
        data-slot="ripple-button"
        onClick={handleClick}
        whileTap={reducedMotion ? undefined : { scale: tapScale }}
        whileHover={reducedMotion ? undefined : { scale: hoverScale }}
        style={{
          position: "relative",
          overflow: "hidden",
          ...style
        }}
        {...props}
      />
    </RippleButtonProvider>
  );
}

type RippleButtonRipplesProps = HTMLMotionProps<"span"> & {
  color?: string;
  scale?: number;
};

function RippleButtonRipples({
  color = "var(--ripple-button-ripple-color, rgb(255 255 255 / 35%))",
  scale = 10,
  transition = { duration: 0.6, ease: "easeOut" },
  style,
  ...props
}: RippleButtonRipplesProps) {
  const { ripples } = useRippleButton();

  return ripples.map((ripple) => (
    <motion.span
      key={ripple.id}
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ scale, opacity: 0 }}
      transition={transition}
      style={{
        position: "absolute",
        borderRadius: "50%",
        pointerEvents: "none",
        width: "20px",
        height: "20px",
        backgroundColor: color,
        top: ripple.y - 10,
        left: ripple.x - 10,
        ...style
      }}
      {...props}
    />
  ));
}

export {
  RippleButton,
  RippleButtonRipples,
  type RippleButtonProps,
  type RippleButtonRipplesProps
};
