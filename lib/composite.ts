import { getSourceRect } from "./crop";
import type { CropState, SlotImage, TychLayout } from "./types";

export function createExportCanvas(
  layout: TychLayout,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas is unavailable in this browser.");
  }
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

export function compositeTych(
  layout: TychLayout,
  slots: Array<SlotImage | null>,
  crops: CropState[],
  target?: HTMLCanvasElement,
): HTMLCanvasElement {
  const { canvas, ctx } = target
    ? (() => {
        target.width = layout.width;
        target.height = layout.height;
        const ctx = target.getContext("2d", { alpha: false, willReadFrequently: true });
        if (!ctx) throw new Error("Canvas is unavailable in this browser.");
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, layout.width, layout.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        return { canvas: target, ctx };
      })()
    : createExportCanvas(layout);

  layout.panels.forEach((panel, i) => {
    const image = slots[i];
    if (!image) return;
    const crop = crops[i];
    const src = getSourceRect(image.width, image.height, panel, crop);
    ctx.drawImage(
      image.bitmap,
      src.sx,
      src.sy,
      src.sw,
      src.sh,
      panel.x,
      panel.y,
      panel.w,
      panel.h,
    );
  });

  return canvas;
}
