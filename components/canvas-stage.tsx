"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { CropState } from "@/lib/types";
import { useTych, useTychLayout } from "./tych-store";
import { PanelCropper } from "./panel-cropper";

export function CanvasStage() {
  const { slots, crops, selected, setSelected, setCrop, addFiles, replaceSlot } =
    useTych();
  const layout = useTychLayout();
  const frameRef = useRef<HTMLDivElement>(null);
  const [cssPerPanelPx, setCssPerPanelPx] = useState(0);

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

  return (
    <section
      onDragOver={(e) => e.preventDefault()}
      onDrop={onStageDrop}
    >
      <div
        ref={frameRef}
        className="relative w-full overflow-hidden rounded-[24px] bg-black"
        style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
      >
        {cssPerPanelPx > 0
          ? layout.panels.map((panel, index) => (
              <PanelCropper
                key={`${layout.count}-${layout.gap}-${index}`}
                panel={panel}
                image={slots[index] ?? null}
                crop={crops[index]}
                selected={selected === index}
                index={index}
                cssPerPanelPx={cssPerPanelPx}
                onSelect={() => setSelected(index)}
                onCrop={(crop: CropState) => setCrop(index, crop)}
                onFiles={(files) => onReplace(index, files)}
              />
            ))
          : null}
      </div>
      <span className="sr-only" aria-live="polite">
        Panel {selected + 1} of {slots.length}
        {crops[selected] ? `, zoom ${crops[selected].zoom.toFixed(2)}` : ""}
      </span>
    </section>
  );
}
