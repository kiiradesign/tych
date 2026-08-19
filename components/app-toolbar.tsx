"use client";

import { cn } from "@/lib/cn";
import type { PanelCount } from "@/lib/types";
import { exportTychPng } from "@/lib/export";
import { useTych } from "./tych-store";

const COUNTS: PanelCount[] = [2, 3, 4];

export function AppToolbar() {
  const {
    count,
    gap,
    slots,
    crops,
    exporting,
    error,
    setCount,
    setExporting,
    setError,
  } = useTych();

  const ready = slots.length === count && slots.every(Boolean);

  async function onSave() {
    if (!ready || exporting) return;
    setError(null);
    setExporting(true);
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await exportTychPng({ count, gap, slots, crops });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the PNG.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-4">
        <div
          role="radiogroup"
          aria-label="Number of images"
          className="flex items-center"
        >
          {COUNTS.map((n) => {
            const active = count === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCount(n)}
                className={cn(
                  "geist-focus-visible h-10 min-w-10 rounded-[6px] text-[14px] font-medium transition-colors duration-150 ease-out",
                  active
                    ? "text-foreground"
                    : "count-idle text-[var(--panel-text-subtle)]",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={!ready || exporting}
          onClick={() => void onSave()}
          className="btn-solid geist-focus-visible h-10 rounded-[8px] px-5 text-[14px] font-medium"
        >
          {exporting ? "Saving…" : "Save"}
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-[13px] text-[var(--panel-text-muted)]">{error}</p>
      ) : null}
    </div>
  );
}
