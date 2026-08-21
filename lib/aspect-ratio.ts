import { PREVIEW_WIDTH } from "./types";

export type AspectRatioId = "1:1" | "4:5" | "3:4" | "2:3" | "9:16";

export const ASPECT_RATIO_OPTIONS: {
  id: AspectRatioId;
  label: string;
  w: number;
  h: number;
}[] = [
  { id: "9:16", label: "9:16", w: 9, h: 16 },
  { id: "2:3", label: "2:3", w: 2, h: 3 },
  { id: "3:4", label: "3:4", w: 3, h: 4 },
  { id: "4:5", label: "4:5", w: 4, h: 5 },
  { id: "1:1", label: "1:1", w: 1, h: 1 },
];

export const DEFAULT_ASPECT_RATIO: AspectRatioId = "9:16";

export function aspectParts(id: AspectRatioId): { w: number; h: number } {
  const opt = ASPECT_RATIO_OPTIONS.find((o) => o.id === id);
  if (!opt) return { w: 1, h: 1 };
  return { w: opt.w, h: opt.h };
}

/** Landscape canvas: width is always the long edge (e.g. 9:16 → 16:9). */
export function previewHeightForAspect(
  id: AspectRatioId,
  width = PREVIEW_WIDTH,
): number {
  const { w, h } = aspectParts(id);
  return Math.max(1, Math.round((width * Math.min(w, h)) / Math.max(w, h)));
}
