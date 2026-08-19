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
  if (typeof CompressionStream === "undefined") {
    throw new Error(
      "This browser cannot encode PNG-8. Try a current Chrome, Safari, or Firefox.",
    );
  }

  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

type Box = {
  colors: number[];
  count: number;
};

function unpack15(c: number): [number, number, number] {
  return [c >> 10, (c >> 5) & 31, c & 31];
}

function expand5(n: number): number {
  return (n << 3) | (n >> 2);
}

function longestChannel(colors: number[]): 0 | 1 | 2 {
  let rmin = 31;
  let rmax = 0;
  let gmin = 31;
  let gmax = 0;
  let bmin = 31;
  let bmax = 0;
  for (const c of colors) {
    const [r, g, b] = unpack15(c);
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

function splitBox(box: Box, hist: Uint32Array): [Box, Box] {
  const ch = longestChannel(box.colors);
  const sorted = [...box.colors].sort((a, b) => unpack15(a)[ch] - unpack15(b)[ch]);
  const half = box.count / 2;
  let acc = 0;
  let cut = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    acc += hist[sorted[i]];
    if (acc >= half) {
      cut = i + 1;
      break;
    }
  }
  if (cut === 0) cut = Math.max(1, Math.floor(sorted.length / 2));

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
    const [rr, gg, bb] = unpack15(c);
    r += expand5(rr) * w;
    g += expand5(gg) * w;
    b += expand5(bb) * w;
    n += w;
  }
  if (n === 0) return [0, 0, 0];
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/**
 * Median-cut palette for opaque pixels. Index 0 is reserved for transparency.
 */
function quantizeOpaque(
  data: Uint8ClampedArray,
  maxColors: number,
): { palette: Uint8Array; map: Uint8Array } {
  const hist = new Uint32Array(32768);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const idx = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
    hist[idx]++;
  }

  const used: number[] = [];
  let total = 0;
  for (let i = 0; i < hist.length; i++) {
    if (hist[i] > 0) {
      used.push(i);
      total += hist[i];
    }
  }

  if (used.length === 0) {
    return { palette: new Uint8Array(3), map: new Uint8Array(32768) };
  }

  const colorBudget = Math.min(maxColors, used.length);
  const boxes: Box[] = [{ colors: used, count: total }];

  while (boxes.length < colorBudget) {
    let best = -1;
    let bestScore = -1;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].colors.length < 2) continue;
      const score = boxes[i].count;
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
  const map = new Uint8Array(32768);
  boxes.forEach((box, i) => {
    const [r, g, b] = boxAverage(box, hist);
    palette[i * 3] = r;
    palette[i * 3 + 1] = g;
    palette[i * 3 + 2] = b;
    const index = i + 1; // 0 reserved for transparency
    for (const c of box.colors) map[c] = index;
  });

  return { palette, map };
}

function buildIndexed(
  imageData: ImageData,
): { indices: Uint8Array; plte: Uint8Array } {
  const { width, height, data } = imageData;
  const { palette, map } = quantizeOpaque(data, 255);
  const indices = new Uint8Array(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    if (data[i + 3] < 128) {
      indices[p] = 0;
      continue;
    }
    const idx = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
    indices[p] = map[idx] || 1;
  }

  const plte = new Uint8Array(3 + palette.length);
  // index 0: unused RGB (fully transparent via tRNS)
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
export async function encodePng8(imageData: ImageData): Promise<Blob> {
  const { width, height } = imageData;
  const { indices, plte } = buildIndexed(imageData);
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

export function downloadBlob(blob: Blob, filename: string) {
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
