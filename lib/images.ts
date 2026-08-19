import type { SlotImage } from "./types";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

export function isAllowedImage(file: File): boolean {
  if (ALLOWED_TYPES.has(file.type)) return true;
  return ALLOWED_EXT.test(file.name);
}

export async function loadSlotImage(file: File): Promise<SlotImage> {
  if (!isAllowedImage(file)) {
    throw new Error("Use a JPG, PNG, or WebP.");
  }

  const url = URL.createObjectURL(file);
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
    return {
      id: crypto.randomUUID(),
      name: file.name,
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

export function disposeSlot(image: SlotImage | null) {
  if (!image) return;
  URL.revokeObjectURL(image.url);
  image.bitmap.close();
}
