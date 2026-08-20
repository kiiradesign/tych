# Tych

**Recreate the classic Twitter/X multi-image polyptych as a single PNG.**

Tych lets you upload 2–4 photos, crop them precisely to the original timeline panel proportions, and export one clean image that looks like the old Twitter media grid — complete with thin black gutters between panels.

The export is a full-color PNG sized from your photos (capped under 5 MB), with sharp outer corners (X already handles the rounding).

Built for the people who miss the art form that disappeared when X switched multi-image posts to carousels.

---

## Why Tych?

There used to be an entire visual language around 2-, 3-, and especially 4-image posts on Twitter. Photographers (particularly in Japan) treated the grid as a polyptych — a single mood composed of multiple frames seen together. The new carousel broke that.

Tych brings the visual result back as a single postable image.

---

## Features

- Choose **2, 3, or 4** images
- Precise per-panel cropping (pan + zoom) that matches the final output exactly
- Classic layouts:
  - **2 images** → side-by-side
  - **3 images** → one large left + two stacked right
  - **4 images** → clean 2×2
- Black gutters (**4 px**)
- Sharp rectangular outer edges (no artificial rounding)
- Full-color PNG export under **5 MB**, resolution taken from your photos
- Fully client-side — images never leave your browser
- Clean, quiet, photographic UI

---

## Export

Layouts match the classic 2-, 3-, and 4-up proportions (the preview is 900 × 506). The downloaded PNG is scaled up from the pixels in your crops, then reduced only if needed to stay under 5 MB.

Gaps between panels are opaque black (**4 px** at preview size, scaled with the export).

Integer rounding: when a split is odd, the leftover pixel goes to the left / top pane
(`448 + 4 + 448 = 900` at preview size).

---

## How to use

1. Select the number of images (2 / 3 / 4).
2. Upload or drag-and-drop your photos.
3. Crop each panel so the composition feels right in the final grid.
4. Preview the assembled Tych.
5. Download the single transparent PNG and post it.

That’s it.

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
git clone <your-repo-url>
cd tych
npm install
npm run dev
```

