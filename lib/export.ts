import { compositeTych } from "@/lib/composite";
import { getTychLayout } from "@/lib/layout";
import { downloadBlob, encodePng8 } from "@/lib/png8";
import {
  EXPORT_HEIGHT,
  EXPORT_MAX_BYTES,
  EXPORT_MAX_WIDTH,
  type CropState,
  type GapPx,
  type PanelCount,
  type SlotImage,
} from "@/lib/types";

export async function exportTychPng(options: {
  count: PanelCount;
  gap: GapPx;
  slots: Array<SlotImage | null>;
  crops: CropState[];
}): Promise<void> {
  const { count, gap, slots, crops } = options;
  const layout = getTychLayout(count, gap);
  if (layout.width > EXPORT_MAX_WIDTH || layout.height > EXPORT_HEIGHT) {
    throw new Error("Export size must stay at 900 × 506.");
  }

  const canvas = compositeTych(layout, slots, crops);
  const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable.");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const blob = await encodePng8(imageData, layout.panels);
  if (blob.size > EXPORT_MAX_BYTES) {
    throw new Error("Could not encode a PNG under 5 MB.");
  }
  await downloadBlob(blob, `tych-${count}.png`);
}
