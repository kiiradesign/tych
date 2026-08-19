export type PanelCount = 2 | 3 | 4;
export type GapPx = 2 | 3;
export type PreviewGround = "checker" | "light" | "dark";

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TychLayout = {
  count: PanelCount;
  gap: GapPx;
  width: number;
  height: number;
  panels: Rect[];
};

export type CropState = {
  /** 1 = cover-fit. Larger values zoom in. */
  zoom: number;
  /** 0–1 along leftover horizontal room. 0.5 is centered. */
  panX: number;
  /** 0–1 along leftover vertical room. 0.5 is centered. */
  panY: number;
};

export type SlotImage = {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  bitmap: ImageBitmap;
};

export const DEFAULT_CROP: CropState = {
  zoom: 1,
  panX: 0.5,
  panY: 0.5,
};

export const MAX_ZOOM = 5;
export const EXPORT_MAX_WIDTH = 900;
/** Shared canvas height for 2, 3, and 4 panels (classic 2-up / ~16:9). */
export const EXPORT_HEIGHT = 506;
