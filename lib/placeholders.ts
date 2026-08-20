import { loadSlotImage } from "./images";
import type { SlotImage } from "./types";

export const PLACEHOLDER_PATHS = [
  "/placeholders/1.jpg",
  "/placeholders/2.jpg",
  "/placeholders/3.jpg",
  "/placeholders/4.jpg",
] as const;

export async function loadPlaceholderSlot(path: string): Promise<SlotImage | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    const name = path.split("/").pop() ?? "placeholder.jpg";
    const file = new File([blob], name, {
      type: blob.type && blob.type !== "application/octet-stream" ? blob.type : "image/jpeg",
    });
    return await loadSlotImage(file);
  } catch {
    return null;
  }
}
