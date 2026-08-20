import type { Rect } from "./types";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n);
  return b;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const payload = concat([typeBytes, data]);
  return concat([u32(data.length), payload, u32(crc32(payload))]);
}

async function zlibDeflate(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream !== "undefined") {
    const stream = new Blob([data as BlobPart])
      .stream()
      .pipeThrough(new CompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  return zlibStore(data);
}

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/** Uncompressed zlib/deflate — used when CompressionStream is missing (older mobile Safari). */
function zlibStore(data: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [new Uint8Array([0x78, 0x01])];
  const max = 65535;
  if (data.length === 0) {
    parts.push(new Uint8Array([1, 0, 0, 0xff, 0xff]));
  } else {
    for (let i = 0; i < data.length; i += max) {
      const slice = data.subarray(i, Math.min(i + max, data.length));
      const last = i + max >= data.length;
      const header = new Uint8Array(5);
      header[0] = last ? 1 : 0;
      header[1] = slice.length & 0xff;
      header[2] = slice.length >> 8;
      const nlen = ~slice.length & 0xffff;
      header[3] = nlen & 0xff;
      header[4] = nlen >> 8;
      parts.push(header, slice);
    }
  }
  parts.push(u32(adler32(data)));
  return concat(parts);
}

type Box = {
  colors: number[];
  count: number;
};

/** 6 bits/channel — finer than 5-bit bins, still a compact histogram. */
function pack18(r: number, g: number, b: number): number {
  return ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
}

function unpack18(c: number): [number, number, number] {
  return [c >> 12, (c >> 6) & 63, c & 63];
}

function expand6(n: number): number {
  return (n << 2) | (n >> 4);
}

function longestChannel(colors: number[]): 0 | 1 | 2 {
  let rmin = 63;
  let rmax = 0;
  let gmin = 63;
  let gmax = 0;
  let bmin = 63;
  let bmax = 0;
  for (const c of colors) {
    const [r, g, b] = unpack18(c);
    if (r < rmin) rmin = r;
    if (r > rmax) rmax = r;
    if (g < gmin) gmin = g;
    if (g > gmax) gmax = g;
    if (b < bmin) bmin = b;
    if (b > bmax) bmax = b;
  }
  const dr = rmax - rmin;
  const dg = gmax - gmin;
  const db = bmax - bmin;
  if (dr >= dg && dr >= db) return 0;
  if (dg >= dr && dg >= db) return 1;
  return 2;
}

function boxRange(colors: number[]): number {
  let rmin = 63;
  let rmax = 0;
  let gmin = 63;
  let gmax = 0;
  let bmin = 63;
  let bmax = 0;
  for (const c of colors) {
    const [r, g, b] = unpack18(c);
    if (r < rmin) rmin = r;
    if (r > rmax) rmax = r;
    if (g < gmin) gmin = g;
    if (g > gmax) gmax = g;
    if (b < bmin) bmin = b;
    if (b > bmax) bmax = b;
  }
  return (rmax - rmin) * (gmax - gmin) * (bmax - bmin);
}

function splitBox(box: Box, hist: Uint32Array): [Box, Box] {
  const ch = longestChannel(box.colors);
  const sorted = box.colors.slice().sort((a, b) => unpack18(a)[ch] - unpack18(b)[ch]);
  // Split unique colors, not population. Population cuts bury ramps
  // (few pixels per hue) under dense clumps of similar greens/grays.
  const cut = Math.max(1, Math.min(sorted.length - 1, Math.floor(sorted.length / 2)));

  const leftColors = sorted.slice(0, cut);
  const rightColors = sorted.slice(cut);
  const left: Box = {
    colors: leftColors,
    count: leftColors.reduce((n, c) => n + hist[c], 0),
  };
  const right: Box = {
    colors: rightColors,
    count: rightColors.reduce((n, c) => n + hist[c], 0),
  };
  return [left, right];
}

function boxAverage(box: Box, hist: Uint32Array): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const c of box.colors) {
    const w = hist[c];
    const [rr, gg, bb] = unpack18(c);
    r += expand6(rr) * w;
    g += expand6(gg) * w;
    b += expand6(bb) * w;
    n += w;
  }
  if (n === 0) return [0, 0, 0];
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function uniqueFromHist(hist: Uint32Array): { used: number[]; total: number } {
  const used: number[] = [];
  let total = 0;
  for (let i = 0; i < hist.length; i++) {
    if (hist[i] > 0) {
      used.push(i);
      total += hist[i];
    }
  }
  return { used, total };
}

function histogramRegion(
  data: Uint8ClampedArray,
  width: number,
  region: { x: number; y: number; w: number; h: number },
): { hist: Uint32Array; score: number } {
  const hist = new Uint32Array(262144);
  let chroma = 0;
  let pixels = 0;
  let unique = 0;
  const x1 = region.x + region.w;
  const y1 = region.y + region.h;
  for (let y = region.y; y < y1; y++) {
    for (let x = region.x; x < x1; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 128) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      pixels++;
      chroma += Math.max(r, g, b) - Math.min(r, g, b);
      const key = pack18(r, g, b);
      if (hist[key] === 0) unique++;
      hist[key]++;
    }
  }
  const avgChroma = pixels === 0 ? 0 : chroma / pixels;
  return { hist, score: Math.max(1, unique * (1 + avgChroma / 24)) };
}

/**
 * Median-cut palette for opaque pixels. Index 0 is reserved for transparency.
 */
function paletteFromHist(hist: Uint32Array, maxColors: number): Uint8Array {
  const { used, total } = uniqueFromHist(hist);
  if (used.length === 0) return new Uint8Array(0);

  const colorBudget = Math.min(maxColors, used.length);
  const boxes: Box[] = [{ colors: used, count: total }];

  while (boxes.length < colorBudget) {
    let best = -1;
    let bestScore = -1;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].colors.length < 2) continue;
      const score = 1 + boxRange(boxes[i].colors);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best === -1) break;
    const [a, b] = splitBox(boxes[best], hist);
    if (a.colors.length === 0 || b.colors.length === 0) break;
    boxes.splice(best, 1, a, b);
  }

  const palette = new Uint8Array(boxes.length * 3);
  boxes.forEach((box, i) => {
    const [r, g, b] = boxAverage(box, hist);
    palette[i * 3] = r;
    palette[i * 3 + 1] = g;
    palette[i * 3 + 2] = b;
  });
  return palette;
}

function allocateBudgets(scores: number[], total: number): number[] {
  const sum = scores.reduce((a, b) => a + b, 0);
  const ks = scores.map((s) => Math.max(8, Math.floor((total * s) / sum)));
  let diff = total - ks.reduce((a, b) => a + b, 0);
  const order = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
  let o = 0;
  while (diff > 0) {
    ks[order[o % order.length]]++;
    diff--;
    o++;
  }
  while (diff < 0) {
    const i = order.find((idx) => ks[idx] > 8);
    if (i === undefined) break;
    ks[i]--;
    diff++;
  }
  return ks;
}

function concatPalettes(parts: Uint8Array[]): Uint8Array {
  const seen = new Set<number>();
  const rgb: number[] = [];
  const add = (r: number, g: number, b: number) => {
    if (rgb.length >= 255 * 3) return;
    const key = (r << 16) | (g << 8) | b;
    if (seen.has(key)) return;
    seen.add(key);
    rgb.push(r, g, b);
  };
  // Round-robin so a late panel (e.g. the rainbow) is not truncated.
  let round = 0;
  let added = true;
  while (added && rgb.length < 255 * 3) {
    added = false;
    for (const part of parts) {
      const i = round * 3;
      if (i + 2 >= part.length) continue;
      add(part[i], part[i + 1], part[i + 2]);
      added = true;
      if (rgb.length >= 255 * 3) break;
    }
    round++;
  }
  return new Uint8Array(rgb);
}

function nearestPaletteIndex(r: number, g: number, b: number, palette: Uint8Array): number {
  let best = 0;
  let bestD = Infinity;
  const n = palette.length / 3;
  for (let i = 0; i < n; i++) {
    const dr = r - palette[i * 3];
    const dg = g - palette[i * 3 + 1];
    const db = b - palette[i * 3 + 2];
    const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best + 1;
}

function buildColorLut(palette: Uint8Array): Uint8Array {
  const lut = new Uint8Array(32768);
  for (let r = 0; r < 32; r++) {
    const r8 = (r << 3) | (r >> 2);
    for (let g = 0; g < 32; g++) {
      const g8 = (g << 3) | (g >> 2);
      for (let b = 0; b < 32; b++) {
        lut[(r << 10) | (g << 5) | b] = nearestPaletteIndex(
          r8,
          g8,
          (b << 3) | (b >> 2),
          palette,
        );
      }
    }
  }
  return lut;
}

function clampByte(n: number): number {
  return n < 0 ? 0 : n > 255 ? 255 : n;
}

function buildIndexed(
  imageData: ImageData,
  panels?: Rect[],
): { indices: Uint8Array; plte: Uint8Array } {
  const { width, height, data } = imageData;
  const regions =
    panels && panels.length > 0
      ? panels
      : [{ x: 0, y: 0, w: width, h: height }];

  const analyses = regions.map((region) => histogramRegion(data, width, region));
  const budgets = allocateBudgets(
    analyses.map((a) => a.score),
    255,
  );
  const localPalettes = analyses.map((a, i) => paletteFromHist(a.hist, budgets[i]));
  let palette = concatPalettes(localPalettes.filter((p) => p.length > 0));
  if (palette.length === 0) palette = new Uint8Array(3);
  const lut = buildColorLut(palette);

  const indices = new Uint8Array(width * height);
  const cur = new Float32Array(width * 3);
  const nxt = new Float32Array(width * 3);

  const addErr = (
    buf: Float32Array,
    x: number,
    y: number,
    w: number,
    er: number,
    eg: number,
    eb: number,
  ) => {
    if (x < 0 || x >= width || y >= height) return;
    if (data[(y * width + x) * 4 + 3] < 128) return;
    const o = x * 3;
    buf[o] += er * w;
    buf[o + 1] += eg * w;
    buf[o + 2] += eb * w;
  };

  for (let y = 0; y < height; y++) {
    const ltr = y % 2 === 0;
    nxt.fill(0);
    for (let xi = 0; xi < width; xi++) {
      const x = ltr ? xi : width - 1 - xi;
      const p = y * width + x;
      const i = p * 4;
      if (data[i + 3] < 128) {
        indices[p] = 0;
        continue;
      }
      const o = x * 3;
      const r = clampByte(data[i] + cur[o]);
      const g = clampByte(data[i + 1] + cur[o + 1]);
      const b = clampByte(data[i + 2] + cur[o + 2]);
      const idx = lut[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)];
      indices[p] = idx;
      const er = r - palette[(idx - 1) * 3];
      const eg = g - palette[(idx - 1) * 3 + 1];
      const eb = b - palette[(idx - 1) * 3 + 2];
      const dx = ltr ? 1 : -1;
      addErr(cur, x + dx, y, 7 / 16, er, eg, eb);
      addErr(nxt, x - dx, y + 1, 3 / 16, er, eg, eb);
      addErr(nxt, x, y + 1, 5 / 16, er, eg, eb);
      addErr(nxt, x + dx, y + 1, 1 / 16, er, eg, eb);
    }
    cur.set(nxt);
  }

  const plte = new Uint8Array(3 + palette.length);
  plte.set(palette, 3);
  return { indices, plte };
}

function filteredScanlines(indices: Uint8Array, width: number, height: number): Uint8Array {
  const row = width + 1;
  const out = new Uint8Array(row * height);
  for (let y = 0; y < height; y++) {
    const o = y * row;
    out[o] = 0;
    out.set(indices.subarray(y * width, (y + 1) * width), o + 1);
  }
  return out;
}

/**
 * 8-bit indexed PNG with a fully transparent index 0.
 * Opaque panel pixels are quantized to ≤255 colors. Gutters stay alpha = 0.
 */
export async function encodePng8(
  imageData: ImageData,
  panels?: Rect[],
): Promise<Blob> {
  const { width, height } = imageData;
  const { indices, plte } = buildIndexed(imageData, panels);
  const idat = await zlibDeflate(filteredScanlines(indices, width, height));

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 3; // indexed color
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const trns = new Uint8Array([0]);

  const png = concat([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("PLTE", plte),
    chunk("tRNS", trns),
    chunk("IDAT", idat),
    chunk("IEND", new Uint8Array(0)),
  ]);

  return new Blob([png as BlobPart], { type: "image/png" });
}

function isAppleTouchDevice() {
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isMobileSave() {
  return (
    /Android/i.test(navigator.userAgent) || isAppleTouchDevice()
  );
}

async function shareImageFile(
  blob: Blob,
  filename: string,
  type: string,
): Promise<"shared" | "cancelled" | "unavailable"> {
  if (typeof navigator.share !== "function") return "unavailable";
  const file = new File([blob], filename, { type });
  if (typeof navigator.canShare === "function" && !navigator.canShare({ files: [file] })) {
    return "unavailable";
  }
  try {
    await navigator.share({ files: [file] });
    return "shared";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "cancelled";
    return "unavailable";
  }
}

function openBlobTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

export async function downloadBlob(blob: Blob, filename: string) {
  if (isMobileSave()) {
    const result = await shareImageFile(blob, filename, blob.type || "image/png");
    if (result === "shared" || result === "cancelled") return;
    if (isAppleTouchDevice()) {
      openBlobTab(blob);
      return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
