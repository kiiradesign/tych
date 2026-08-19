import type { CropState, Rect } from "./types";
import { MAX_ZOOM } from "./types";

export type SourceRect = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

export function coverScale(imageW: number, imageH: number, panel: Rect): number {
  return Math.max(panel.w / imageW, panel.h / imageH);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function getSourceRect(
  imageW: number,
  imageH: number,
  panel: Rect,
  crop: CropState,
): SourceRect {
  const zoom = clamp(crop.zoom, 1, MAX_ZOOM);
  const scale = coverScale(imageW, imageH, panel) * zoom;
  const sw = Math.min(imageW, panel.w / scale);
  const sh = Math.min(imageH, panel.h / scale);
  const maxX = Math.max(0, imageW - sw);
  const maxY = Math.max(0, imageH - sh);
  const sx = clamp(crop.panX, 0, 1) * maxX;
  const sy = clamp(crop.panY, 0, 1) * maxY;
  return { sx, sy, sw, sh };
}

/** Convert a CSS-pixel drag into a new pan, keeping the panel covered. */
export function panFromDrag(
  crop: CropState,
  imageW: number,
  imageH: number,
  panel: Rect,
  cssDx: number,
  cssDy: number,
  cssPerPanelPx: number,
): CropState {
  const { sw, sh } = getSourceRect(imageW, imageH, panel, crop);
  const scale = coverScale(imageW, imageH, panel) * clamp(crop.zoom, 1, MAX_ZOOM);
  const srcDx = cssDx / cssPerPanelPx / scale;
  const srcDy = cssDy / cssPerPanelPx / scale;
  const maxX = Math.max(0, imageW - sw);
  const maxY = Math.max(0, imageH - sh);

  return {
    ...crop,
    panX: maxX === 0 ? 0.5 : clamp(crop.panX - srcDx / maxX, 0, 1),
    panY: maxY === 0 ? 0.5 : clamp(crop.panY - srcDy / maxY, 0, 1),
  };
}

export function zoomAt(
  crop: CropState,
  nextZoom: number,
): CropState {
  return {
    ...crop,
    zoom: clamp(nextZoom, 1, MAX_ZOOM),
  };
}
