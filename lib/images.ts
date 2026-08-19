import type { SlotImage } from "./types";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const ALLOWED_EXT = /\.(jpe?g|png|webp|heic|heif|hif)$/i;
const HEIC_EXT = /\.(heic|heif|hif)$/i;
const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

export const IMAGE_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".hif",
].join(",");

export function isAllowedImage(file: File): boolean {
  if (ALLOWED_TYPES.has(file.type)) return true;
  return ALLOWED_EXT.test(file.name);
}

function looksLikeHeic(file: File): boolean {
  return HEIC_TYPES.has(file.type) || HEIC_EXT.test(file.name);
}

async function decodeHeic(file: Blob): Promise<Blob> {
  const { heicTo } = await import("heic-to");
  return heicTo({
    blob: file,
    type: "image/png",
  });
}

async function bitmapFrom(source: Blob, name: string): Promise<SlotImage> {
  const url = URL.createObjectURL(source);
  try {
    const bitmap = await createImageBitmap(source, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
    return {
      id: crypto.randomUUID(),
      name,
      url,
      width: bitmap.width,
      height: bitmap.height,
      bitmap,
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Could not read that photograph.");
  }
}

export async function loadSlotImage(file: File): Promise<SlotImage> {
  const known = isAllowedImage(file);

  if (!known) {
    const { isHeic } = await import("heic-to");
    if (!(await isHeic(file))) {
      throw new Error("Use a JPG, PNG, or HEIC.");
    }
  }

  if (looksLikeHeic(file) || !known) {
    try {
      return await bitmapFrom(await decodeHeic(file), file.name);
    } catch {
      throw new Error("Could not read that photograph.");
    }
  }

  try {
    return await bitmapFrom(file, file.name);
  } catch {
    const { isHeic } = await import("heic-to");
    if (await isHeic(file)) {
      return await bitmapFrom(await decodeHeic(file), file.name);
    }
    throw new Error("Could not read that photograph.");
  }
}

export function disposeSlot(image: SlotImage | null) {
  if (!image) return;
  URL.revokeObjectURL(image.url);
  image.bitmap.close();
}
