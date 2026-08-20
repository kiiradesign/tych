"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { useSmoothCorners } from "@lisse/react";
import { getSourceRect } from "@/lib/crop";
import { LISSE_SMOOTHING } from "@/lib/lisse";
import type { CropState, Rect, SlotImage } from "@/lib/types";
import { CropModal } from "./crop-modal";
import { PanelSlot } from "./panel-cropper";
import { useTych, useTychLayout } from "./tych-store";

const DRAG_THRESHOLD = 10;

function hitPanel(
  panels: Rect[],
  cssPerPanelPx: number,
  frame: HTMLDivElement,
  clientX: number,
  clientY: number,
): number | null {
  const rect = frame.getBoundingClientRect();
  const x = (clientX - rect.left) / cssPerPanelPx;
  const y = (clientY - rect.top) / cssPerPanelPx;
  const index = panels.findIndex(
    (panel) =>
      x >= panel.x &&
      x < panel.x + panel.w &&
      y >= panel.y &&
      y < panel.y + panel.h,
  );
  return index === -1 ? null : index;
}

function swapShifts(
  from: number,
  to: number | null,
  panels: Rect[],
  css: number,
): Array<{ x: number; y: number }> {
  return panels.map((panel, index) => {
    if (to === null || from === to || index !== to) return { x: 0, y: 0 };
    const home = panels[from];
    return {
      x: (home.x - panel.x) * css,
      y: (home.y - panel.y) * css,
    };
  });
}

export function CanvasStage() {
  const {
    slots,
    crops,
    selected,
    setCrop,
    addFiles,
    replaceSlot,
    clearSlot,
    moveSlot,
  } = useTych();
  const layout = useTychLayout();
  const frameRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const [cssPerPanelPx, setCssPerPanelPx] = useState(0);
  const [cropping, setCropping] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{
    image: SlotImage;
    crop: CropState;
    panel: Rect;
    w: number;
    h: number;
  } | null>(null);
  const drag = useRef<{
    from: number;
    x: number;
    y: number;
    pointerId: number;
    moved: boolean;
    originX: number;
    originY: number;
    ghostX: number;
    ghostY: number;
    over: number;
  } | null>(null);

  const shifts = useMemo(
    () =>
      swapShifts(
        dragFrom ?? 0,
        dragFrom === null ? null : dragOver,
        layout.panels,
        cssPerPanelPx,
      ),
    [cssPerPanelPx, dragFrom, dragOver, layout.panels],
  );

  useSmoothCorners(
    frameRef,
    { radius: 24, smoothing: LISSE_SMOOTHING },
    { autoEffects: false, fallbackBorderRadius: "24px" },
  );

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setCssPerPanelPx(w / layout.width);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout.width]);

  function placeGhost(x: number, y: number) {
    const el = ghostRef.current;
    if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  const clearDragState = useCallback(() => {
    drag.current = null;
    setDragFrom(null);
    setDragOver(null);
    setGhost(null);
    document.body.style.removeProperty("cursor");
  }, []);

  const onStageDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      const files = [...e.dataTransfer.files];
      if (files.length) void addFiles(files);
    },
    [addFiles],
  );

  const onReplace = useCallback(
    (index: number, files: File[]) => {
      if (files.length === 1) void replaceSlot(index, files[0]);
      else void addFiles(files, index);
    },
    [addFiles, replaceSlot],
  );

  const onSlotPointerDown = useCallback(
    (index: number, e: React.PointerEvent<HTMLDivElement>) => {
      if (!slots[index] || cropping !== null) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = e.currentTarget.getBoundingClientRect();
      drag.current = {
        from: index,
        x: e.clientX,
        y: e.clientY,
        pointerId: e.pointerId,
        moved: false,
        originX: rect.left,
        originY: rect.top,
        ghostX: rect.left,
        ghostY: rect.top,
        over: index,
      };
    },
    [cropping, slots],
  );

  const onSlotPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const session = drag.current;
      if (!session || session.pointerId !== e.pointerId) return;
      const dist = Math.hypot(e.clientX - session.x, e.clientY - session.y);
      if (!session.moved && dist < DRAG_THRESHOLD) return;

      const ghostX = session.originX + (e.clientX - session.x);
      const ghostY = session.originY + (e.clientY - session.y);
      session.ghostX = ghostX;
      session.ghostY = ghostY;

      if (!session.moved) {
        session.moved = true;
        const image = slots[session.from];
        const panel = layout.panels[session.from];
        if (!image || !panel) return;
        document.body.style.cursor = "grabbing";
        setDragFrom(session.from);
        setDragOver(session.from);
        setGhost({
          image,
          crop: crops[session.from],
          panel,
          w: e.currentTarget.getBoundingClientRect().width,
          h: e.currentTarget.getBoundingClientRect().height,
        });
      }

      placeGhost(ghostX, ghostY);

      const frame = frameRef.current;
      if (!frame || cssPerPanelPx <= 0) return;
      const hit = hitPanel(
        layout.panels,
        cssPerPanelPx,
        frame,
        e.clientX,
        e.clientY,
      );
      if (hit === null || hit === session.over) return;
      session.over = hit;
      setDragOver(hit);
    },
    [crops, cssPerPanelPx, layout.panels, slots],
  );

  const onSlotPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const session = drag.current;
      if (!session || session.pointerId !== e.pointerId) return;
      const from = session.from;
      const moved = session.moved;
      const over = session.over;
      const frame = frameRef.current;

      if (!moved) {
        clearDragState();
        setCropping(from);
        return;
      }

      if (frame) frame.dataset.settling = "";
      flushSync(() => {
        if (over !== from) moveSlot(from, over);
        setDragFrom(null);
        setDragOver(null);
        setGhost(null);
      });
      drag.current = null;
      document.body.style.removeProperty("cursor");
      requestAnimationFrame(() => {
        if (frame) delete frame.dataset.settling;
      });
    },
    [clearDragState, moveSlot],
  );

  useLayoutEffect(() => {
    const session = drag.current;
    if (!ghost || !session?.moved) return;
    placeGhost(session.ghostX, session.ghostY);
  }, [ghost]);

  useEffect(() => {
    if (cropping !== null && !slots[cropping]) setCropping(null);
  }, [cropping, slots]);

  const croppingImage =
    cropping !== null ? (slots[cropping] ?? null) : null;
  const croppingPanel =
    cropping !== null ? layout.panels[cropping] : null;
  const ghostSrc = ghost
    ? getSourceRect(ghost.image.width, ghost.image.height, ghost.panel, ghost.crop)
    : null;
  const ghostScale = ghost && ghostSrc ? ghost.w / ghostSrc.sw : 1;

  return (
    <section
      onDragOver={(e) => e.preventDefault()}
      onDrop={onStageDrop}
    >
      <div className="tych-frame-shell">
        <div
          ref={frameRef}
          className="tych-frame relative w-full"
          style={{
            aspectRatio: `${layout.width} / ${layout.height}`,
            borderRadius: 24,
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-black" aria-hidden />
          {cssPerPanelPx > 0
            ? layout.panels.map((panel, index) => (
                <PanelSlot
                  key={slots[index]?.id ?? `empty-${layout.count}-${index}`}
                  panel={panel}
                  image={slots[index] ?? null}
                  crop={crops[index]}
                  index={index}
                  cssPerPanelPx={cssPerPanelPx}
                  dragging={dragFrom === index}
                  hideChrome={dragFrom !== null}
                  shiftX={shifts[index]?.x ?? 0}
                  shiftY={shifts[index]?.y ?? 0}
                  onPointerDown={(e) => onSlotPointerDown(index, e)}
                  onPointerMove={onSlotPointerMove}
                  onPointerUp={onSlotPointerUp}
                  onPointerCancel={() => clearDragState()}
                  onActivate={() => {
                    if (slots[index]) setCropping(index);
                  }}
                  onFiles={(files) => onReplace(index, files)}
                  onRemove={() => clearSlot(index)}
                />
              ))
            : null}
        </div>
      </div>
      {ghost && ghostSrc && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={ghostRef}
              className="reorder-ghost"
              style={{
                width: ghost.w,
                height: ghost.h,
                transform: `translate3d(${drag.current?.ghostX ?? 0}px, ${drag.current?.ghostY ?? 0}px, 0)`,
              }}
            >
              <div className="reorder-ghost-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ghost.image.url}
                  alt=""
                  draggable={false}
                  className="absolute max-w-none select-none"
                  style={{
                    width: ghost.image.width * ghostScale,
                    height: ghost.image.height * ghostScale,
                    left: -ghostSrc.sx * ghostScale,
                    top: -ghostSrc.sy * ghostScale,
                  }}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
      {cropping !== null && croppingImage && croppingPanel ? (
        <CropModal
          image={croppingImage}
          crop={crops[cropping]}
          panel={croppingPanel}
          index={cropping}
          onCrop={(crop) => setCrop(cropping, crop)}
          onReplace={(file) => void replaceSlot(cropping, file)}
          onClose={() => setCropping(null)}
        />
      ) : null}
      <span className="sr-only" aria-live="polite">
        Panel {selected + 1} of {slots.length}
      </span>
    </section>
  );
}
