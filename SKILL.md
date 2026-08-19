---
name: creative-editor-ui
description: >-
  Builds browser-based creative-tool UIs with Geist typography, Vercel Geist
  color tokens, Dialkit controls, and Emil design-engineering motion. Use when
  implementing sidebar + canvas editors similar to https://visualpoetry.kiira.in/
  or https://sumi.kiira.in/ — do not assume access to those private repos.
---

# Creative editor UI

Standalone kit for agents building local-first creative tools in Next.js. Reference the live products only by URL — never assume private repo access.

## Before you start

1. **Install Emil's design engineering skill** from https://github.com/emilkowalski/skill (`skills/emil-design-eng/SKILL.md`). Read it before motion, hover, or interaction polish. Course: https://animations.dev
2. **Read Geist tokens** in [tokens.md](tokens.md) — sourced from [Vercel light](https://vercel.com/design.md) and [Vercel dark](https://vercel.com/design.dark.md).
3. Browse the target product in a browser if possible:
   - https://visualpoetry.kiira.in/ — three-column: inputs | canvas | parameters/palette/export
   - https://sumi.kiira.in/ — sidebar stack + full canvas; history on canvas; aspect ratio + orientation

## Stack (locked)

| Package | Role |
|---------|------|
| Next.js 15 + React 19 + TypeScript | App shell |
| Tailwind CSS **v3** (not v4) | Utilities |
| **geist** (`GeistSans`, `GeistMono`) | **Required** UI typography — never substitute Inter/system-only |
| **dialkit** | Sliders, segmented controls, field selects embedded in panels |
| **next-themes** | `class` strategy, unique `storageKey` per app |
| **pretty-color-picker** | Custom color picker — never `<input type="color">`. [npm](https://www.npmjs.com/package/pretty-color-picker) · [GitHub](https://github.com/kiiradesign/pretty-color-picker) |
| **framer-motion** | Theme-toggle icon only; everything else CSS |
| **@phosphor-icons/react** | Icons (`duotone` theme toggle, `bold` carets) |
| Radix UI (`radix-ui` package) | Popovers |
| clsx + tailwind-merge | `cn()` helper |

```bash
npm install geist dialkit pretty-color-picker next-themes framer-motion \
  @phosphor-icons/react radix-ui clsx tailwind-merge class-variance-authority
```

Import in root layout:

```tsx
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "dialkit/styles.css";
```

```tsx
<body className={`${GeistSans.variable} ${GeistMono.variable} font-sans ...`}>
```

Tailwind:

```ts
fontFamily: {
  sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
  mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
},
```

## Design principles

- **Geist Sans** for all UI copy; **Geist Mono** for hex values and tabular numbers.
- **Border-first hierarchy** — flat panels, 1px `gray-400` strokes, no glass blur.
- **6px** radius on panels and controls (Geist `rounded.sm`).
- **Typography sizes** (do not change): kicker 11px/600 uppercase; labels 13px/500; body 14px; row min-height 36px; Dialkit row height 36px / radius 8px (keep Dialkit defaults).
- Light: white panels on `#fafafa` sidebar, `#eaeaea` borders.
- Dark: `#1a1a1a` panels on `#000000` page, `#2e2e2e` borders.

Full token table: [tokens.md](tokens.md).

## Panel class system

Define in `globals.css` `@layer components`. Prefix: `panel-*` (not project-specific names).

| Class | Purpose |
|-------|---------|
| `.panel-shell` | Transparent page wrapper around canvas |
| `.panel-card` | Bordered section card (`--panel-bg`, `--panel-border`) |
| `.panel-kicker` | 11px uppercase section label |
| `.panel-title` / `.panel-copy` | Strong / muted text |
| `.panel-row` | 36px interactive row |
| `.panel-row-value` | 13px tabular-nums muted value |
| `.panel-action` | Button row; `active:scale(0.97)` |
| `.panel-action-primary` | Filled primary action |
| `.panel-field` | Input/select surface |
| `.geist-focus-visible` | Two-layer focus ring per Geist |

Hover styles **must** be gated: `@media (hover: hover) and (pointer: fine)`.

CSS source for tokens + components: [tokens.md](tokens.md#panel-css).

## Dialkit integration

**Source:** https://github.com/joshpuckett/dialkit · https://joshpuckett.me/dialkit

### Layout wiring

```tsx
// app/layout.tsx
import { ThemedDialRoot } from "@/components/themed-dial-root";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans ...`}>
        <Providers>{children}</Providers>
        <ThemedDialRoot />  {/* DialRoot synced to next-themes */}
      </body>
    </html>
  );
}
```

`ThemedDialRoot` passes `theme="light" | "dark" | "system"` from `resolvedTheme` after `mounted`.

### Embedded controls (production pattern)

Do **not** use the floating `useDialKit` dev panel in shipped UI. Embed Dialkit inside panel cards:

```tsx
<div className="panel-card p-4">
  <p className="panel-kicker mb-4">Parameters</p>
  <div className="dialkit-root" data-theme={dialTheme}>
    <Slider label="Size" value={50} min={1} max={100} onChange={...} />
  </div>
</div>
```

Wrap Dialkit groups with a small client component that sets `className="dialkit-root"` + `data-theme` from `useTheme()` (wait for `mounted`).

Override Dialkit CSS variables to match Geist — see [tokens.md](tokens.md#dialkit-overrides). Keep `--dial-radius: 8px` and `--dial-row-height: 36px`.

### Custom Dialkit wrappers

Build thin wrappers as needed:

- **Field select** — compact trigger for ratio/format dropdowns inside labeled rows
- **Segmented control** — orientation or binary toggles using `dialkit-segmented` classes from Dialkit CSS

## Color picker

Use [`pretty-color-picker`](https://github.com/kiiradesign/pretty-color-picker) via `components/ui/color-picker.tsx` — never `<input type="color">`.

Integration pattern (Visual Poetry):

- Load with `lib/load-pretty-color-picker.ts` (explicit `customElements.define` for Next.js)
- Mount imperatively to `document.body` after the swatch button exists
- Set `movable` + `data-positioned` before connect so the library does not clear fixed positioning
- Open/close via swatch click; reposition to the **left** of right-sidebar palette rows (`.panel-row` top, swatch left edge) so the panel floats over the canvas
- Sync `theme` with `next-themes`; keep Last Used history enabled (default)
- One picker open at a time; dismiss on outside click or Escape

## Theming

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="YOUR-APP-theme">
```

Gate theme-dependent UI behind `mounted` to avoid hydration flash. `suppressHydrationWarning` on `<html>`.

## Layout patterns

### Pattern A — sidebar + canvas (like https://sumi.kiira.in/)

```
┌──────────────────┬─────────────────────────────┐
│ [logo] [theme]   │                    [undo redo]│
│ tagline          │                             │
├──────────────────┤         canvas              │
│ ABOUT   panel    │                             │
│ PALETTE panel    │                             │
│ CANVAS  panel    │                             │
│ EXPORT  panel    │                             │
└──────────────────┴─────────────────────────────┘
```

- Sidebar: `bg-sidebar` (`#fafafa` light / `#000000` dark), `border-sidebar-border`
- Canvas: `bg-background`, centered aspect-ratio frame with `border` + 6px radius
- Controls that belong on canvas (undo/redo): top-right overlay, not in sidebar

### Pattern B — three columns (like https://visualpoetry.kiira.in/)

```
┌──────────┬─────────────────┬──────────┐
│ inputs   │     canvas      │ params   │
│ panels   │                 │ palette  │
│          │                 │ export   │
└──────────┴─────────────────┴──────────┘
```

Same panel card + kicker + Dialkit patterns in side columns.

## Motion (Emil + Geist)

Apply **Emil design-eng skill** rules. Defaults for this kit:

| Pattern | Value |
|---------|-------|
| Easing | `cubic-bezier(0.175, 0.885, 0.32, 1.1)` as `--ease-out` (Geist) |
| Press | `active:scale-[0.94]`–`0.97` |
| Duration | 150ms rows/buttons; 150–200ms popovers |
| Popover entry | `scale(0.95)` + fade — never from `scale(0)` |
| Frequent UI | CSS transitions only |
| Reduced motion | Drop transforms; keep opacity |

Theme toggle: optional framer-motion icon crossfade; button uses `.panel-row`.

## Agent checklist

- [ ] Geist font wired in layout + Tailwind — **mandatory**
- [ ] Emil skill installed and consulted for interactions
- [ ] Geist color tokens from [tokens.md](tokens.md) — not shadcn zinc OKLCH defaults
- [ ] `dialkit/styles.css` imported; `ThemedDialRoot` in layout
- [ ] Dialkit embedded in `panel-card` sections, not floating dev panel
- [x] Custom color picker (`pretty-color-picker`) — opens beside right sidebar over canvas
- [ ] Tailwind v3 only — do **not** import `tw-animate-css` or Tailwind v4 CSS
- [ ] `prefers-reduced-motion` respected
- [ ] About section mentions local-only / no server storage when applicable

## shadcn (optional scaffold)

If using shadcn CLI: `style: radix-luma`, `baseColor: zinc`, `iconLibrary: phosphor`. App chrome uses custom `panel-*` classes, not shadcn Button/Input. Restyle `PopoverContent` with panel tokens.

## Canvas / render font exception

UI chrome uses **Geist Sans** and **Geist Mono** only. Some creative tools (e.g. Visual Poetry) keep a **separate render font** for poem glyphs on the canvas and in export — often IBM Plex Mono loaded via `next/font` as `--font-render`. Do **not** change canvas `context.font` or layout engine font strings unless the user asks. Poem **input** fields still use Geist Sans like the rest of the UI.

## What not to do

- Do not clone or grep private repos — use this skill + live URLs only
- Do not pick fonts other than Geist for UI chrome
- Do not use frosted-glass `backdrop-filter` on panels
- Do not use heavy drop shadows on cards — borders define hierarchy
- Do not skip Dialkit variable overrides (stock Dialkit colors won't match Geist)
