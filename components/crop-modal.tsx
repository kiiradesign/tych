"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getSourceRect, panFromDrag, zoomAt } from "@/lib/crop";
import { IMAGE_ACCEPT } from "@/lib/images";
import type { CropState, Rect, SlotImage } from "@/lib/types";
import { LisseButton } from "./lisse-button";

const FADE = 0.38;

export function CropModal({
  image,
  crop,
  panel,
  index,
  onCrop,
  onClose,
  onReplace,
}: {
  image: SlotImage;
  crop: CropState;
  panel: Rect;
  index: number;
  onCrop: (crop: CropState) => void;
  onClose: () => void;
  onReplace: (file: File) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cropRef = useRef(crop);
  const cssPerPanelPxRef = useRef(1);
  cropRef.current = crop;

  const [stage, setStage] = useState({ w: 0, h: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setStage({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      const next = zoomAt(cropRef.current, cropRef.current.zoom + delta);
      cropRef.current = next;
      onCrop(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onCrop]);

  const src = getSourceRect(image.width, image.height, panel, crop);
  const pad = 16;
  const innerW = Math.max(1, stage.w - pad * 2);
  const innerH = Math.max(1, stage.h - pad * 2);
  const aspect = panel.w / panel.h;
  let cropW = innerW;
  let cropH = cropW / aspect;
  if (cropH > innerH) {
    cropH = innerH;
    cropW = cropH * aspect;
  }
  const cropLeft = (stage.w - cropW) / 2;
  const cropTop = (stage.h - cropH) / 2;
  const displayScale = cropW / src.sw;
  const imgLeft = cropLeft - src.sx * displayScale;
  const imgTop = cropTop - src.sy * displayScale;
  const imgW = image.width * displayScale;
  const imgH = image.height * displayScale;
  cssPerPanelPxRef.current = cropW / panel.w;

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        zoom: cropRef.current.zoom,
      };
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const point = pointers.current.get(e.pointerId);
    if (!point) return;

    if (pointers.current.size >= 2 && pinch.current) {
      point.x = e.clientX;
      point.y = e.clientY;
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinch.current.dist > 0) {
        const next = zoomAt(
          cropRef.current,
          pinch.current.zoom * (dist / pinch.current.dist),
        );
        cropRef.current = next;
        onCrop(next);
      }
      return;
    }

    const dx = e.clientX - point.x;
    const dy = e.clientY - point.y;
    point.x = e.clientX;
    point.y = e.clientY;
    const next = panFromDrag(
      cropRef.current,
      image.width,
      image.height,
      panel,
      dx,
      dy,
      cssPerPanelPxRef.current,
    );
    cropRef.current = next;
    onCrop(next);
  }

  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
  }

  return createPortal(
    <div className="crop-modal-root fixed inset-0 z-[10050] flex items-center justify-center overflow-y-auto bg-[var(--ds-background-100)]">
      <button
        type="button"
        aria-label="Close crop"
        className="absolute inset-0 bg-[var(--ds-background-100)]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Crop photograph ${index + 1}`}
        className="relative z-10 mx-auto flex w-full max-w-[720px] flex-col px-6 py-8 sm:px-8 [container-type:inline-size]"
      >
        <div
          ref={stageRef}
          className="relative w-full cursor-grab overflow-hidden bg-black active:cursor-grabbing"
          style={{
            width: "100%",
            height: `min(50dvh, 460px, calc(100cqw * ${panel.h} / ${panel.w}))`,
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          {stage.w > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none select-none"
                style={{
                  width: imgW,
                  height: imgH,
                  left: imgLeft,
                  top: imgTop,
                  opacity: FADE,
                }}
              />
              <div
                className="absolute overflow-hidden"
                style={{
                  left: cropLeft,
                  top: cropTop,
                  width: cropW,
                  height: cropH,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute max-w-none select-none"
                  style={{
                    width: imgW,
                    height: imgH,
                    left: -src.sx * displayScale,
                    top: -src.sy * displayScale,
                  }}
                />
              </div>
              <div
                className="pointer-events-none absolute ring-1 ring-inset ring-white/50"
                style={{
                  left: cropLeft,
                  top: cropTop,
                  width: cropW,
                  height: cropH,
                }}
              />
            </>
          ) : null}
        </div>
        <p className="panel-copy mt-2 text-center text-[13px]">
          Drag to pan · pinch or scroll to zoom
        </p>
        <div className="mt-4 flex w-full items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-quiet geist-focus-visible px-3 text-[14px] font-medium"
          >
            Replace image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onReplace(file);
            }}
          />
          <LisseButton
            radius={6}
            onClick={onClose}
            className="btn-solid px-3 text-[14px] font-medium"
          >
            Done
          </LisseButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
