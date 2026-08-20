"use client";

import { useRef } from "react";
import { getSourceRect } from "@/lib/crop";
import { cn } from "@/lib/cn";
import { IMAGE_ACCEPT } from "@/lib/images";
import type { CropState, Rect, SlotImage } from "@/lib/types";
import { LisseButton } from "./lisse-button";

function slotTransform(shiftX: number, shiftY: number) {
  return `translate3d(${shiftX}px, ${shiftY}px, 0)`;
}

export function PanelSlot({
  panel,
  image,
  crop,
  index,
  cssPerPanelPx,
  dragging,
  hideChrome,
  shiftX,
  shiftY,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onActivate,
  onFiles,
  onRemove,
}: {
  panel: Rect;
  image: SlotImage | null;
  crop: CropState;
  index: number;
  cssPerPanelPx: number;
  dragging: boolean;
  hideChrome: boolean;
  shiftX: number;
  shiftY: number;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: () => void;
  onActivate: () => void;
  onFiles: (files: File[]) => void;
  onRemove: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const src = image
    ? getSourceRect(image.width, image.height, panel, crop)
    : null;
  const displayScale = src ? (panel.w * cssPerPanelPx) / src.sw : 1;

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-label={
        image
          ? `Photograph ${index + 1}. Drag to reorder, tap to crop.`
          : `Add photograph ${index + 1}`
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
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
          if (!image) rootRef.current?.querySelector("input")?.click();
          else onActivate();
        }
      }}
      className={cn(
        "panel-slot absolute overflow-hidden outline-none",
        image ? "cursor-grab" : "cursor-pointer",
        dragging && "cursor-grabbing",
      )}
      data-lifted={dragging ? "true" : undefined}
      style={{
        left: panel.x * cssPerPanelPx,
        top: panel.y * cssPerPanelPx,
        width: panel.w * cssPerPanelPx,
        height: panel.h * cssPerPanelPx,
        touchAction: "none",
        transform: slotTransform(shiftX, shiftY),
        zIndex: dragging ? 2 : shiftX || shiftY ? 3 : undefined,
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
          {hideChrome ? null : (
            <LisseButton
            radius={12}
            aria-label={`Remove photograph ${index + 1}`}
            wrapClassName="absolute right-2 top-2 z-10"
            className="remove-photo grid size-6 place-items-center bg-black/55 text-white active:scale-[0.97]"
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
          </LisseButton>
          )}
        </>
      ) : (
        <label className="flex h-full w-full cursor-pointer items-center justify-center bg-muted">
          <input
            type="file"
            accept={IMAGE_ACCEPT}
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
