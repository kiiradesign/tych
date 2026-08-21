# Tych

**Recreate the classic Twitter/X multi-image polyptych as a single PNG.**

Tych lets you upload 2–4 photos, crop them precisely to the panel proportions, and export one clean image that looks like the old Twitter media grid — complete with thin black gutters between panels.

The export is a full-color PNG sized from your photos (long edge capped at 4096 px, encoded under 5 MB), with sharp outer corners (X already handles the rounding).

**Live:** [tych.kiira.in](https://tych.kiira.in)

Built for the people who miss the art form that disappeared when X switched multi-image posts to carousels.

---

## Why Tych?

There used to be an entire visual language around 2-, 3-, and especially 4-image posts on Twitter. Photographers (particularly in Japan) treated the grid as a polyptych — a single mood composed of multiple frames seen together. The new carousel broke that.

Tych brings the visual result back as a single postable image.

---

## Features

- Choose **2, 3, or 4** images
- **Ratio** picker — 9:16, 2:3, 3:4, 4:5, or 1:1 (rendered landscape; width is always the long edge). Default: **16:9** (900 × 506).
- Per-panel cropping in a **centered crop modal** — pan, pinch, or scroll to zoom; what you see is what exports
- **Drag to reorder** panels on the grid (swap by dragging one photo onto another)
- Classic layouts:
  - **2 images** → side-by-side
  - **3 images** → one large left + two stacked right
  - **4 images** → clean 2×2
- Black gutters (**4 px**)
- Sharp rectangular outer edges (no artificial rounding)
- Full-color PNG export under **5 MB**, resolution taken from your source photos
- Fully client-side — images never leave your browser
- Dark, quiet, photographic UI (Geist + Dialkit)

---

## Export

Layouts match the classic 2-, 3-, and 4-up panel splits. The on-screen preview is **900 px wide**; height follows the chosen aspect ratio (e.g. 1:1 → 900 × 900, 9:16 → 900 × 506).

The downloaded PNG is scaled up from the pixels in your crops, then reduced only if needed to stay under 5 MB. Filename: `Tych-{count}.png`.

Gaps between panels are opaque black (**4 px** at preview size, scaled with the export).

Integer rounding: when a split is odd, the leftover pixel goes to the left / top pane
(`448 + 4 + 448 = 900` at preview size).

---

## How to use

1. Select the number of images (2 / 3 / 4).
2. Pick a **ratio** for the overall grid.
3. Upload or drag-and-drop your photos.
4. **Drag** panels to reorder, or **tap** one to open the crop modal and adjust framing.
5. Preview the assembled Tych.
6. Download the PNG and post it.

That's it.

---

## Tech

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS v3 + Geist + Dialkit
- Pure client-side Canvas processing
- Full-color PNG export with opaque black gutters

No backend. No uploads. No tracking.

---

## Local development

```bash
git clone https://github.com/kiiradesign/tych.git
cd tych
npm install
npm run dev
```
