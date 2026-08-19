import type { GapPx, PanelCount, Rect, TychLayout } from "./types";
import { EXPORT_HEIGHT, EXPORT_MAX_WIDTH } from "./types";

/**
 * Integer split of `total` into two parts separated by `gap`.
 *
 * When `total - gap` is odd, the leftover pixel goes to the first part
 * (left or top). That matches the community 2-up example:
 * 449 + 3 + 448 = 900.
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

export function canvasSizeFor(_count: PanelCount): { width: number; height: number } {
  return { width: EXPORT_MAX_WIDTH, height: EXPORT_HEIGHT };
}

export function getTychLayout(count: PanelCount, gap: GapPx): TychLayout {
  const { width, height } = canvasSizeFor(count);
  const [left, right] = splitWithGap(width, gap);
  const rightX = left + gap;

  let panels: Rect[];

  if (count === 2) {
    panels = [
      { x: 0, y: 0, w: left, h: height },
      { x: rightX, y: 0, w: right, h: height },
    ];
  } else if (count === 3) {
    const [top, bottom] = splitWithGap(height, gap);
    panels = [
      { x: 0, y: 0, w: left, h: height },
      { x: rightX, y: 0, w: right, h: top },
      { x: rightX, y: top + gap, w: right, h: bottom },
    ];
  } else {
    const [top, bottom] = splitWithGap(height, gap);
    panels = [
      { x: 0, y: 0, w: left, h: top },
      { x: rightX, y: 0, w: right, h: top },
      { x: 0, y: top + gap, w: left, h: bottom },
      { x: rightX, y: top + gap, w: right, h: bottom },
    ];
  }

  const layout = { count, gap, width, height, panels };
  assertCleanLayout(layout);
  return layout;
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
