"use client";

import { useRef } from "react";
import { flushSync } from "react-dom";
import { exportTychPng } from "@/lib/export";
import { IMAGE_ACCEPT } from "@/lib/images";
import { AspectRatioSelect } from "./aspect-ratio-select";
import { useTych } from "./tych-store";

export function AppToolbar() {
  const {
    count,
    gap,
    aspectRatio,
    slots,
    crops,
    exporting,
    error,
    addFiles,
    replaceAll,
    setAspectRatio,
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
      await exportTychPng({ count, gap, aspectRatio, slots, crops });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not save the PNG.");
    } finally {
      setExporting(false);
    }
  }

  const fileActionLabel = atMax ? "Replace" : "Add";

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={exporting}
            onClick={() => inputRef.current?.click()}
            className="btn-quiet geist-focus-visible shrink-0 px-2.5 text-[14px] font-medium sm:px-3"
          >
            {fileActionLabel}
          </button>
          <AspectRatioSelect
            value={aspectRatio}
            onChange={setAspectRatio}
            disabled={exporting}
          />
        </div>
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
        <button
          type="button"
          disabled={!ready || exporting}
          onClick={() => void onSave()}
          className="btn-solid geist-focus-visible shrink-0 px-2.5 text-[14px] font-medium sm:px-3"
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
