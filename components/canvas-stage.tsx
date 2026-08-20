"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { useSmoothCorners } from "@lisse/react";
import { LISSE_SMOOTHING } from "@/lib/lisse";
import type { Rect } from "@/lib/types";
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
  const [cssPerPanelPx, setCssPerPanelPx] = useState(0);
  const [cropping, setCropping] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const drag = useRef<{
    from: number;
    x: number;
    y: number;
    pointerId: number;
    moved: boolean;
    dx: number;
    dy: number;
    over: number;
    el: HTMLDivElement;
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

  function followSlot() {
    const session = drag.current;
    if (!session?.moved) return;
    session.el.style.transition = "none";
    session.el.style.transform = `translate3d(${session.dx}px, ${session.dy}px, 0) scale(1.02)`;
    session.el.style.zIndex = "12";
  }

  const clearDragState = useCallback(() => {
    const el = drag.current?.el;
    if (el) {
      el.style.removeProperty("transition");
      el.style.removeProperty("transform");
      el.style.removeProperty("z-index");
    }
    drag.current = null;
    setDragFrom(null);
    setDragOver(null);
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
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = {
        from: index,
        x: e.clientX,
        y: e.clientY,
        pointerId: e.pointerId,
        moved: false,
        dx: 0,
        dy: 0,
        over: index,
        el: e.currentTarget,
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

      session.dx = e.clientX - session.x;
      session.dy = e.clientY - session.y;

      if (!session.moved) {
        session.moved = true;
        document.body.style.cursor = "grabbing";
        setDragFrom(session.from);
        setDragOver(session.from);
      }

      followSlot();

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
    [cssPerPanelPx, layout.panels],
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
      drag.current = null;
      flushSync(() => {
        if (over !== from) moveSlot(from, over);
        setDragFrom(null);
        setDragOver(null);
      });
      session.el.style.removeProperty("transition");
      session.el.style.removeProperty("transform");
      session.el.style.removeProperty("z-index");
      document.body.style.removeProperty("cursor");
      requestAnimationFrame(() => {
        if (frame) delete frame.dataset.settling;
      });
    },
    [clearDragState, moveSlot],
  );

  useLayoutEffect(() => {
    followSlot();
  });

  useEffect(() => {
    if (cropping !== null && !slots[cropping]) setCropping(null);
  }, [cropping, slots]);

  const croppingImage =
    cropping !== null ? (slots[cropping] ?? null) : null;
  const croppingPanel =
    cropping !== null ? layout.panels[cropping] : null;

  return (
    <section
      onDragOver={(e) => e.preventDefault()}
      onDrop={onStageDrop}
    >
      <div
        className="tych-frame-shell"
        data-reordering={dragFrom !== null ? "" : undefined}
      >
        <div
          ref={frameRef}
          className="tych-frame relative w-full"
          data-reordering={dragFrom !== null ? "" : undefined}
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
