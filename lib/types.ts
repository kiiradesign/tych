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
  gap: number;
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
/** Preview canvas — export is sized from the source photos. */
export const PREVIEW_WIDTH = 900;
export const PREVIEW_HEIGHT = 506;
/** Longer export edge. Browser canvas limits; we shrink further to stay under 5 MB. */
export const EXPORT_MAX_EDGE = 4096;
/** Encoded PNG must stay strictly below 5 MB. */
export const EXPORT_MAX_BYTES = 5 * 1024 * 1024 - 1;
