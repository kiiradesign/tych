# tych

**Recreate the classic Twitter/X multi-image polyptych as a single transparent PNG.**

tych lets you upload 2–4 photos, crop them precisely to the original timeline panel proportions, and export one clean image that looks like the old Twitter media grid — complete with the thin transparent gutters that create the familiar window-pane / grid-line illusion.

The final image is an 8-bit PNG (with transparency), capped at 900 px wide, with sharp outer corners (Twitter already handles the rounding).

Built for the people who miss the art form that disappeared when X switched multi-image posts to carousels.

---

## Why tych?

There used to be an entire visual language around 2-, 3-, and especially 4-image posts on Twitter. Photographers (particularly in Japan) treated the grid as a polyptych — a single mood composed of multiple frames seen together. The new carousel broke that.

tych brings the visual result back as a single postable image.

---

## Features

- Choose **2, 3, or 4** images
- Precise per-panel cropping (pan + zoom) that matches the final output exactly
- Classic layouts:
  - **2 images** → side-by-side
  - **3 images** → one large left + two stacked right
  - **4 images** → clean 2×2
- Transparent gutters (default **3 px**, optional 2 px) for the authentic grid-line look
- Sharp rectangular outer edges (no artificial rounding)
- Single **8-bit PNG** export with transparency, max width **900 px**
- Fully client-side — images never leave your browser
- Clean, quiet, photographic UI

---

## Exact export sizes (max width 900 px)

| Images | Layout                          | Overall size   | Notes                          |
|--------|---------------------------------|----------------|--------------------------------|
| 2      | Side-by-side                    | 900 × 506      | Two equal panels               |
| 3      | Large left + stacked right      | 900 × 600      | Classic Twitter 3-up           |
| 4      | 2×2                             | 900 × 900      | Square polyptych               |

Gaps between panels are fully transparent (default 3 px).

Integer rounding: when a split is odd, the leftover pixel goes to the left / top pane
(`449 + 3 + 448 = 900`). With a 2 px gutter the 900 px axis is even, so panes are equal.

---

## How to use

1. Select the number of images (2 / 3 / 4).
2. Upload or drag-and-drop your photos.
3. Crop each panel so the composition feels right in the final grid.
4. Preview the assembled tych.
5. Download the single transparent PNG and post it.

That’s it.

---

## Tech

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS v3 + Geist + Dialkit
- Pure client-side Canvas processing
- 8-bit indexed PNG export with a fully transparent gutter index

No backend. No uploads. No tracking.

---

## Local development

```bash
git clone <your-repo-url>
cd tych
npm install
npm run dev
```

