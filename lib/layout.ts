import type { AspectRatioId, GapPx, PanelCount, Rect, TychLayout } from "./types";
import { PREVIEW_WIDTH } from "./types";
import { DEFAULT_ASPECT_RATIO, previewHeightForAspect } from "./aspect-ratio";

/**
 * Integer split of `total` into two parts separated by `gap`.
 *
 * When `total - gap` is odd, the leftover pixel goes to the first part
 * (left or top). At 4 px: `448 + 4 + 448 = 900`.
 */
export function splitWithGap(total: number, gap: number): [number, number] {
  const inner = total - gap;
  const first = Math.ceil(inner / 2);
  const second = inner - first;
  return [first, second];
}

export function panelCountFor(imageCount: number): PanelCount {
  const n = Math.min(4, Math.max(1, imageCount));
  if (n <= 2) return 2;
  return n as PanelCount;
}

export function getTychLayout(
  count: PanelCount,
  gap: number,
  width = PREVIEW_WIDTH,
  height?: number,
  aspectRatio?: AspectRatioId,
): TychLayout {
  const h = height ?? previewHeightForAspect(aspectRatio ?? DEFAULT_ASPECT_RATIO, width);
  const [left, right] = splitWithGap(width, gap);
  const rightX = left + gap;

  let panels: Rect[];

  if (count === 2) {
    panels = [
      { x: 0, y: 0, w: left, h: h },
      { x: rightX, y: 0, w: right, h: h },
    ];
  } else if (count === 3) {
    const [top, bottom] = splitWithGap(h, gap);
    panels = [
      { x: 0, y: 0, w: left, h: h },
      { x: rightX, y: 0, w: right, h: top },
      { x: rightX, y: top + gap, w: right, h: bottom },
    ];
  } else {
    const [top, bottom] = splitWithGap(h, gap);
    panels = [
      { x: 0, y: 0, w: left, h: top },
      { x: rightX, y: 0, w: right, h: top },
      { x: 0, y: top + gap, w: left, h: bottom },
      { x: rightX, y: top + gap, w: right, h: bottom },
    ];
  }

  const layout = { count, gap, width, height: h, panels };
  assertCleanLayout(layout);
  return layout;
}

/** Same grid proportions scaled to `width`, keeping the chosen aspect ratio. */
export function layoutAtWidth(
  count: PanelCount,
  previewGap: GapPx,
  width: number,
  aspectRatio: AspectRatioId,
): TychLayout {
  const w = Math.max(1, Math.round(width));
  const height = previewHeightForAspect(aspectRatio, w);
  const gap = Math.max(1, Math.round((previewGap * w) / PREVIEW_WIDTH));
  return getTychLayout(count, gap, w, height);
}

export function assertCleanLayout(layout: TychLayout): void {
  const { width, height, gap, panels, count } = layout;
  const [left, right] = splitWithGap(width, gap);

  if (left + gap + right !== width) {
    throw new Error("Column split does not fill width.");
  }

  for (const panel of panels) {
    if (![panel.x, panel.y, panel.w, panel.h].every(Number.isInteger)) {
      throw new Error("Layout contains non-integer pixels.");
    }
  }

  if (count === 2) {
    if (panels[0].w + gap + panels[1].w !== width) {
      throw new Error("2-up panels do not fill width.");
    }
  }

  if (count === 3 || count === 4) {
    const [top, bottom] = splitWithGap(height, gap);
    if (top + gap + bottom !== height) {
      throw new Error("Row split does not fill height.");
    }
  }
}

export function layoutLabel(count: PanelCount): string {
  switch (count) {
    case 2:
      return "Diptych";
    case 3:
      return "Triptych";
    case 4:
      return "Quadriptych";
  }
}
