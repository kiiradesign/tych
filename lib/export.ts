import { compositeTych } from "@/lib/composite";
import { getTychLayout } from "@/lib/layout";
import { downloadBlob, encodePng8 } from "@/lib/png8";
import type { CropState, GapPx, PanelCount, SlotImage } from "@/lib/types";

export async function exportTychPng(options: {
  count: PanelCount;
  gap: GapPx;
  slots: Array<SlotImage | null>;
  crops: CropState[];
}): Promise<void> {
  const { count, gap, slots, crops } = options;
  const layout = getTychLayout(count, gap);
  const canvas = compositeTych(layout, slots, crops);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const blob = await encodePng8(imageData);
  downloadBlob(blob, `tych-${count}.png`);
}
