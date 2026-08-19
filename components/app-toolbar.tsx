"use client";

import { useRef } from "react";
import { exportTychPng } from "@/lib/export";
import { useTych } from "./tych-store";

export function AppToolbar() {
  const {
    count,
    gap,
    slots,
    crops,
    exporting,
    error,
    addFiles,
    setExporting,
    setError,
  } = useTych();
  const inputRef = useRef<HTMLInputElement>(null);

  const ready = slots.length === count && slots.every(Boolean);
  const atMax = slots.filter(Boolean).length >= 4;

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
        <button
          type="button"
          disabled={exporting || atMax}
          onClick={() => inputRef.current?.click()}
          className="btn-quiet geist-focus-visible h-10 rounded-[8px] px-4 text-[14px] font-medium"
        >
          Add images
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            if (files.length) void addFiles(files);
          }}
        />
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
