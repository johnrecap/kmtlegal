"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useReducedMotion, type MotionValue, type SpringOptions, type HTMLMotionProps } from "motion/react";

import { getStrictContext } from "./get-strict-context";

/**
 * Vendored from animate-ui (https://animate-ui.com) — MIT, Skyleen.
 * Source: apps/www/registry/primitives/effects/tilt/index.tsx
 * Local adaptation: asChild/Slot support removed; prefers-reduced-motion
 * disables the rotation entirely.
 */
type TiltContextType = {
  sRX: MotionValue<number>;
  sRY: MotionValue<number>;
  transition: SpringOptions;
};

const [TiltProvider, useTilt] = getStrictContext<TiltContextType>("TiltContext");

type TiltProps = HTMLMotionProps<"div"> & {
  maxTilt?: number;
  perspective?: number;
  transition?: SpringOptions;
};

function Tilt({
  maxTilt = 10,
  perspective = 800,
  style,
  transition = {
    stiffness: 300,
    damping: 25,
    mass: 0.5
  },
  onMouseMove,
  onMouseLeave,
  ...props
}: TiltProps) {
  const rX = useMotionValue(0);
  const rY = useMotionValue(0);

  const sRX = useSpring(rX, transition);
  const sRY = useSpring(rY, transition);
  const reducedMotion = useReducedMotion();

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(e);
      if (reducedMotion) return;
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const nx = px * 2 - 1;
      const ny = py * 2 - 1;
      rY.set(nx * maxTilt);
      rX.set(-ny * maxTilt);
    },
    [maxTilt, rX, rY, onMouseMove, reducedMotion]
  );

  const handleMouseLeave = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(e);
      rX.set(0);
      rY.set(0);
    },
    [rX, rY, onMouseLeave]
  );

  return (
    <TiltProvider value={{ sRX, sRY, transition }}>
      <motion.div
        style={{
          perspective,
          transformStyle: "preserve-3d",
          willChange: "transform",
          ...style
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      />
    </TiltProvider>
  );
}

type TiltContentProps = HTMLMotionProps<"div">;

function TiltContent({ children, style, transition, ...props }: TiltContentProps) {
  const { sRX, sRY, transition: tiltTransition } = useTilt();

  return (
    <motion.div
      style={{
        rotateX: sRX,
        rotateY: sRY,
        willChange: "transform",
        ...style
      }}
      transition={transition ?? tiltTransition}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { Tilt, TiltContent, type TiltProps, type TiltContentProps };
