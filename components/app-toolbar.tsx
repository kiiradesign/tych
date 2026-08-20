"use client";

import { useRef } from "react";
import { flushSync } from "react-dom";
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
    replaceAll,
    setExporting,
    setError,
  } = useTych();
  const inputRef = useRef<HTMLInputElement>(null);

  const ready = slots.length === count && slots.every(Boolean);
  const atMax = slots.filter(Boolean).length >= 4;

  async function onSave() {
    if (!ready || exporting) return;
    flushSync(() => {
      setError(null);
      setExporting(true);
    });
    try {
      await exportTychPng({ count, gap, slots, crops });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
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
          disabled={exporting}
          onClick={() => inputRef.current?.click()}
          className="btn-quiet geist-focus-visible px-3 text-[14px] font-medium"
        >
          {atMax ? "Replace images" : "Add images"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            if (!files.length) return;
            if (atMax) void replaceAll(files);
            else void addFiles(files);
          }}
        />
        <LisseButton
          radius={6}
          disabled={!ready || exporting}
          onClick={() => void onSave()}
          className="btn-solid px-3 text-[14px] font-medium"
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
