"use client";

import { useSmoothCorners } from "@lisse/react";
import { useRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { LISSE_SMOOTHING } from "@/lib/lisse";

export function LisseButton({
  radius,
  autoEffects = false,
  wrapClassName,
  className,
  type = "button",
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  radius: number;
  autoEffects?: boolean;
  wrapClassName?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useSmoothCorners(
    ref,
    { radius, smoothing: LISSE_SMOOTHING },
    { autoEffects, fallbackBorderRadius: `${radius}px` },
  );

  return (
    <span className={cn("lisse-focus", wrapClassName)}>
      <button
        {...props}
        ref={ref}
        type={type}
        className={className}
        style={{ borderRadius: radius, ...style }}
      />
    </span>
  );
}
