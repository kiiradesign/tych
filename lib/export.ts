import { getSourceRect } from "@/lib/crop";
import { compositeTych } from "@/lib/composite";
import { getTychLayout, layoutAtWidth } from "@/lib/layout";
import { downloadBlob } from "@/lib/png8";
import {
  EXPORT_MAX_BYTES,
  EXPORT_MAX_EDGE,
  PREVIEW_WIDTH,
  type CropState,
  type GapPx,
  type PanelCount,
  type SlotImage,
} from "@/lib/types";

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not encode PNG."));
    }, "image/png");
  });
}

function downsample(source: HTMLCanvasElement, width: number): HTMLCanvasElement {
  const height = Math.max(1, Math.round((source.height * width) / source.width));
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return out;
}

/** Largest preview-relative width that keeps 1:1 source pixels in the tightest crop. */
function idealExportWidth(
  count: PanelCount,
  gap: GapPx,
  slots: Array<SlotImage | null>,
  crops: CropState[],
): number {
  const preview = getTychLayout(count, gap);
  let scale = 1;
  preview.panels.forEach((panel, i) => {
    const image = slots[i];
    if (!image) return;
    const src = getSourceRect(image.width, image.height, panel, crops[i]);
    scale = Math.max(scale, src.sw / panel.w, src.sh / panel.h);
  });
  const width = Math.round(preview.width * scale);
  return Math.min(EXPORT_MAX_EDGE, Math.max(PREVIEW_WIDTH, width));
}

async function encodePngUnderLimit(source: HTMLCanvasElement): Promise<Blob> {
  let canvas = source;
  let blob = await canvasToPng(canvas);
  if (blob.size <= EXPORT_MAX_BYTES) return blob;

  let width = canvas.width;
  while (blob.size > EXPORT_MAX_BYTES && width > PREVIEW_WIDTH) {
    const factor = Math.sqrt(EXPORT_MAX_BYTES / blob.size) * 0.97;
    width = Math.max(PREVIEW_WIDTH, Math.floor(width * factor));
    canvas = downsample(source, width);
    blob = await canvasToPng(canvas);
  }

  if (blob.size > EXPORT_MAX_BYTES) {
    throw new Error("Could not encode a PNG under 5 MB.");
  }
  return blob;
}

export async function exportTychPng(options: {
  count: PanelCount;
  gap: GapPx;
  slots: Array<SlotImage | null>;
  crops: CropState[];
}): Promise<void> {
  const { count, gap, slots, crops } = options;
  const width = idealExportWidth(count, gap, slots, crops);
  const layout = layoutAtWidth(count, gap, width);
  const canvas = compositeTych(layout, slots, crops);
  const blob = await encodePngUnderLimit(canvas);
  await downloadBlob(blob, `Tych-${count}.png`);
}
