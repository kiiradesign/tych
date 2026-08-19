"use client";

import { useEffect, useRef } from "react";
import { getSourceRect, panFromDrag, zoomAt } from "@/lib/crop";
import { cn } from "@/lib/cn";
import type { CropState, Rect, SlotImage } from "@/lib/types";

export function PanelCropper({
  panel,
  image,
  crop,
  selected,
  index,
  cssPerPanelPx,
  onSelect,
  onCrop,
  onFiles,
  onRemove,
}: {
  panel: Rect;
  image: SlotImage | null;
  crop: CropState;
  selected: boolean;
  index: number;
  cssPerPanelPx: number;
  onSelect: () => void;
  onCrop: (crop: CropState) => void;
  onFiles: (files: File[]) => void;
  onRemove: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; x: number; y: number; crop: CropState } | null>(
    null,
  );
  const cropRef = useRef(crop);
  cropRef.current = crop;

  const src = image
    ? getSourceRect(image.width, image.height, panel, crop)
    : null;
  const displayScale = src ? (panel.w * cssPerPanelPx) / src.sw : 1;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !image) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      onCrop(zoomAt(cropRef.current, cropRef.current.zoom + delta));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [image, onCrop]);

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-label={image ? `Crop panel ${index + 1}` : `Add photograph ${index + 1}`}
      onPointerDown={(e) => {
        onSelect();
        if (!image) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        pointer.current = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          crop: cropRef.current,
        };
      }}
      onPointerMove={(e) => {
        if (!pointer.current || pointer.current.id !== e.pointerId || !image) return;
        const dx = e.clientX - pointer.current.x;
        const dy = e.clientY - pointer.current.y;
        pointer.current.x = e.clientX;
        pointer.current.y = e.clientY;
        const next = panFromDrag(
          pointer.current.crop,
          image.width,
          image.height,
          panel,
          dx,
          dy,
          cssPerPanelPx,
        );
        pointer.current.crop = next;
        onCrop(next);
      }}
      onPointerUp={(e) => {
        if (pointer.current?.id === e.pointerId) pointer.current = null;
      }}
      onPointerCancel={() => {
        pointer.current = null;
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = [...e.dataTransfer.files];
        if (files.length) onFiles(files);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
          if (!image) rootRef.current?.querySelector("input")?.click();
        }
      }}
      className={cn(
        "absolute overflow-hidden outline-none",
        image ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        selected && image && "ring-1 ring-inset ring-white/40",
      )}
      style={{
        left: panel.x * cssPerPanelPx,
        top: panel.y * cssPerPanelPx,
        width: panel.w * cssPerPanelPx,
        height: panel.h * cssPerPanelPx,
        touchAction: "none",
      }}
    >
      {image && src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt=""
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              width: image.width * displayScale,
              height: image.height * displayScale,
              left: -src.sx * displayScale,
              top: -src.sy * displayScale,
            }}
          />
          <button
            type="button"
            aria-label={`Remove photograph ${index + 1}`}
            className="remove-photo geist-focus-visible absolute right-2 top-2 z-10 grid size-6 place-items-center rounded-full bg-black/55 text-white active:scale-[0.97]"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </>
      ) : (
        <label className="flex h-full w-full cursor-pointer items-center justify-center bg-[#f2f2f2] dark:bg-[#171717]">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              e.target.value = "";
              if (files.length) onFiles(files);
            }}
          />
          <span className="text-[13px] text-[var(--panel-text-subtle)]">
            {index + 1}
          </span>
        </label>
      )}
    </div>
  );
}
