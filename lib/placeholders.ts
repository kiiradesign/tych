import { loadSlotImage } from "./images";
import type { SlotImage } from "./types";

export const PLACEHOLDER_PATHS = [
  "/placeholders/1.png",
  "/placeholders/2.png",
  "/placeholders/3.png",
  "/placeholders/4.png",
] as const;

export async function loadPlaceholderSlot(path: string): Promise<SlotImage | null> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const name = path.split("/").pop() ?? "placeholder.png";
    const file = new File([blob], name, {
      type: blob.type && blob.type !== "application/octet-stream" ? blob.type : "image/png",
    });
    return await loadSlotImage(file);
  } catch {
    return null;
  }
}
