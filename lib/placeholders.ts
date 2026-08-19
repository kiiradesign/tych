import { loadSlotImage } from "./images";
import type { SlotImage } from "./types";

export const PLACEHOLDER_PATHS = [
  "/placeholders/1.heic",
  "/placeholders/2.heic",
  "/placeholders/3.heic",
  "/placeholders/4.heic",
] as const;

export async function loadPlaceholderSlot(path: string): Promise<SlotImage | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    const name = path.split("/").pop() ?? "placeholder.heic";
    const file = new File([blob], name, {
      type: blob.type && blob.type !== "application/octet-stream" ? blob.type : "image/heic",
    });
    return await loadSlotImage(file);
  } catch {
    return null;
  }
}
