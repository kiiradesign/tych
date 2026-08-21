"use client";

import { useEffect, useRef, useState } from "react";
import { ASPECT_RATIO_OPTIONS, type AspectRatioId } from "@/lib/aspect-ratio";
import { cn } from "@/lib/cn";

export function AspectRatioSelect({
  value,
  onChange,
  disabled,
}: {
  value: AspectRatioId;
  onChange: (value: AspectRatioId) => void;
  disabled?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const label = ASPECT_RATIO_OPTIONS.find((o) => o.id === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "ratio-select geist-focus-visible flex items-center gap-1.5 px-2.5 text-[13px]",
          disabled && "opacity-50",
        )}
      >
        <span className="whitespace-nowrap text-[var(--panel-text-muted)]">
          Aspect ratio
        </span>
        <span className="font-mono text-[13px] tabular-nums text-[var(--panel-text-strong)]">
          {label}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={cn(
            "shrink-0 text-[var(--panel-text-subtle)] transition-transform duration-150",
            open && "rotate-180",
          )}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Aspect ratio"
          className="ratio-select-menu"
        >
          {ASPECT_RATIO_OPTIONS.map((opt) => (
            <li key={opt.id} role="none">
              <button
                type="button"
                role="option"
                aria-selected={opt.id === value}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={cn(
                  "ratio-select-option",
                  opt.id === value && "ratio-select-option-active",
                )}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
