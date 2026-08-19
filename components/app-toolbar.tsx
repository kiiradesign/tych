"use client";

import { useRef } from "react";
import { exportTychPng } from "@/lib/export";
import { IMAGE_ACCEPT } from "@/lib/images";
import { LisseButton } from "./lisse-button";
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
        <LisseButton
          radius={8}
          autoEffects
          disabled={exporting || atMax}
          onClick={() => inputRef.current?.click()}
          className="btn-quiet h-10 px-4 text-[14px] font-medium"
        >
          Add images
        </LisseButton>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            if (files.length) void addFiles(files);
          }}
        />
        <LisseButton
          radius={8}
          disabled={!ready || exporting}
          onClick={() => void onSave()}
          className="btn-solid h-10 px-5 text-[14px] font-medium"
        >
          {exporting ? "Saving…" : "Save"}
        </LisseButton>
      </div>
      {error ? (
        <p className="mt-3 text-[13px] text-[var(--panel-text-muted)]">{error}</p>
      ) : null}
    </div>
  );
}
