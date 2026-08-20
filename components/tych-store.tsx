"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getTychLayout, panelCountFor } from "@/lib/layout";
import { zoomAt } from "@/lib/crop";
import { disposeSlot, loadSlotImage } from "@/lib/images";
import { loadPlaceholderSlot, PLACEHOLDER_PATHS } from "@/lib/placeholders";
import {
  DEFAULT_CROP,
  type CropState,
  type GapPx,
  type PanelCount,
  type PreviewGround,
  type SlotImage,
} from "@/lib/types";

type TychContextValue = {
  count: PanelCount;
  gap: GapPx;
  slots: Array<SlotImage | null>;
  crops: CropState[];
  selected: number;
  previewGround: PreviewGround;
  exporting: boolean;
  error: string | null;
  setCount: (count: PanelCount) => void;
  setGap: (gap: GapPx) => void;
  setSelected: (index: number) => void;
  setPreviewGround: (ground: PreviewGround) => void;
  setCrop: (index: number, crop: CropState) => void;
  setZoom: (index: number, zoom: number) => void;
  addFiles: (files: File[], startIndex?: number) => Promise<void>;
  replaceAll: (files: File[]) => Promise<void>;
  replaceSlot: (index: number, file: File) => Promise<void>;
  clearSlot: (index: number) => void;
  moveSlot: (from: number, to: number) => void;
  setExporting: (value: boolean) => void;
  setError: (message: string | null) => void;
};

const TychContext = createContext<TychContextValue | null>(null);

function emptySlots(count: PanelCount): Array<SlotImage | null> {
  return Array.from({ length: count }, () => null);
}

function emptyCrops(count: PanelCount): CropState[] {
  return Array.from({ length: count }, () => ({ ...DEFAULT_CROP }));
}

function swapIndex<T>(items: T[], from: number, to: number): T[] {
  if (from === to) return items;
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const temp = next[from];
  next[from] = next[to];
  next[to] = temp;
  return next;
}

export function TychProvider({ children }: { children: ReactNode }) {
  const [count, setCountState] = useState<PanelCount>(4);
  const [gap, setGap] = useState<GapPx>(4);
  const [slots, setSlots] = useState<Array<SlotImage | null>>(() => emptySlots(4));
  const [crops, setCrops] = useState<CropState[]>(() => emptyCrops(4));
  const [selected, setSelected] = useState(0);
  const [previewGround, setPreviewGround] = useState<PreviewGround>("checker");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const created: SlotImage[] = [];

    void (async () => {
      const loaded = await Promise.all(
        PLACEHOLDER_PATHS.map((path) => loadPlaceholderSlot(path)),
      );
      for (const image of loaded) {
        if (image) created.push(image);
      }

      if (!alive) {
        created.forEach((image) => disposeSlot(image));
        return;
      }

      if (created.length === 0) return;

      setSlots((prev) => {
        const next = [...prev];
        loaded.forEach((image, index) => {
          if (!image) return;
          disposeSlot(next[index] ?? null);
          next[index] = image;
        });
        return next;
      });
    })();

    return () => {
      alive = false;
    };
  }, []);

  const setCount = useCallback((next: PanelCount) => {
    setCountState(next);
    setSlots((prev) => {
      const nextSlots = emptySlots(next);
      for (let i = 0; i < next; i++) {
        nextSlots[i] = prev[i] ?? null;
      }
      prev.slice(next).forEach(disposeSlot);
      return nextSlots;
    });
    setCrops((prev) => {
      const nextCrops = emptyCrops(next);
      for (let i = 0; i < next; i++) {
        nextCrops[i] = prev[i] ?? { ...DEFAULT_CROP };
      }
      return nextCrops;
    });
    setSelected((s) => Math.min(s, next - 1));
  }, []);

  const setCrop = useCallback((index: number, crop: CropState) => {
    setCrops((prev) => prev.map((c, i) => (i === index ? crop : c)));
  }, []);

  const setZoom = useCallback((index: number, zoom: number) => {
    setCrops((prev) => prev.map((c, i) => (i === index ? zoomAt(c, zoom) : c)));
  }, []);

  const placeFile = useCallback(async (index: number, file: File) => {
    const image = await loadSlotImage(file);
    setSlots((prev) => {
      const next = [...prev];
      disposeSlot(next[index] ?? null);
      next[index] = image;
      return next;
    });
    setCrops((prev) => prev.map((c, i) => (i === index ? { ...DEFAULT_CROP } : c)));
    setSelected(index);
  }, []);

  const addFiles = useCallback(
    async (files: File[], startIndex?: number) => {
      setError(null);
      const filled = slots.filter(Boolean).length;
      const empty = filled === 0;
      const remaining = 4 - filled;
      const appending = startIndex === undefined && !empty;

      if (appending && remaining <= 0) return;

      const incoming = files
        .filter(Boolean)
        .slice(0, appending ? remaining : 4);
      if (incoming.length === 0) return;

      const firstEmpty = slots.findIndex((s) => !s);
      let begin: number;
      let targetCount: PanelCount;

      if (startIndex !== undefined) {
        begin = startIndex;
        targetCount = panelCountFor(Math.min(4, startIndex + incoming.length));
      } else if (empty) {
        begin = 0;
        targetCount = panelCountFor(incoming.length);
      } else {
        begin = firstEmpty === -1 ? filled : firstEmpty;
        targetCount = panelCountFor(filled + incoming.length);
      }

      const toLoad = incoming.slice(0, Math.max(0, targetCount - begin));
      if (toLoad.length === 0) return;

      try {
        if (targetCount !== count) setCountState(targetCount);

        const loaded = await Promise.all(
          toLoad.map(async (file, i) => ({
            index: begin + i,
            image: await loadSlotImage(file),
          })),
        );

        setSlots((prev) => {
          const next = Array.from(
            { length: targetCount },
            (_, i) => prev[i] ?? null,
          );
          prev.slice(targetCount).forEach(disposeSlot);
          for (const { index, image } of loaded) {
            disposeSlot(next[index] ?? null);
            next[index] = image;
          }
          return next;
        });
        setCrops((prev) => {
          const reset = new Set(loaded.map((item) => item.index));
          return Array.from({ length: targetCount }, (_, i) =>
            reset.has(i) ? { ...DEFAULT_CROP } : (prev[i] ?? { ...DEFAULT_CROP }),
          );
        });
        if (loaded[0]) setSelected(loaded[0].index);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read those files.");
      }
    },
    [count, slots],
  );

  const replaceAll = useCallback(async (files: File[]) => {
    setError(null);
    const incoming = files.filter(Boolean).slice(0, 4);
    if (incoming.length === 0) return;
    const targetCount = panelCountFor(incoming.length);

    try {
      const loaded = await Promise.all(
        incoming.map(async (file, i) => ({
          index: i,
          image: await loadSlotImage(file),
        })),
      );

      if (targetCount !== count) setCountState(targetCount);

      setSlots((prev) => {
        prev.forEach(disposeSlot);
        const next = emptySlots(targetCount);
        for (const { index, image } of loaded) next[index] = image;
        return next;
      });
      setCrops(emptyCrops(targetCount));
      setSelected(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read those files.");
    }
  }, [count]);

  const replaceSlot = useCallback(
    async (index: number, file: File) => {
      setError(null);
      try {
        await placeFile(index, file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read that file.");
      }
    },
    [placeFile],
  );

  const moveSlot = useCallback((from: number, to: number) => {
    if (from === to) return;
    setSlots((prev) => swapIndex(prev, from, to));
    setCrops((prev) => swapIndex(prev, from, to));
    setSelected(to);
  }, []);

  const clearSlot = useCallback(
    (index: number) => {
      disposeSlot(slots[index] ?? null);
      const remaining = slots
        .map((slot, i) => ({
          slot,
          crop: crops[i] ?? { ...DEFAULT_CROP },
        }))
        .filter((_, i) => i !== index)
        .filter((item): item is { slot: SlotImage; crop: CropState } => Boolean(item.slot));

      const nextCount = panelCountFor(remaining.length || 1);
      const nextSlots = emptySlots(nextCount);
      const nextCrops = emptyCrops(nextCount);
      remaining.forEach((item, i) => {
        nextSlots[i] = item.slot;
        nextCrops[i] = item.crop;
      });

      setCountState(nextCount);
      setSlots(nextSlots);
      setCrops(nextCrops);
      setSelected((current) => Math.min(current, nextCount - 1));
    },
    [crops, slots],
  );

  const value = useMemo<TychContextValue>(
    () => ({
      count,
      gap,
      slots,
      crops,
      selected,
      previewGround,
      exporting,
      error,
      setCount,
      setGap,
      setSelected,
      setPreviewGround,
      setCrop,
      setZoom,
      addFiles,
      replaceAll,
      replaceSlot,
      clearSlot,
      moveSlot,
      setExporting,
      setError,
    }),
    [
      addFiles,
      replaceAll,
      clearSlot,
      moveSlot,
      count,
      crops,
      error,
      exporting,
      gap,
      previewGround,
      replaceSlot,
      selected,
      setCount,
      setCrop,
      setZoom,
      slots,
    ],
  );

  return <TychContext.Provider value={value}>{children}</TychContext.Provider>;
}

export function useTych() {
  const ctx = useContext(TychContext);
  if (!ctx) throw new Error("useTych must be used within TychProvider");
  return ctx;
}

export function useTychLayout() {
  const { count, gap } = useTych();
  return getTychLayout(count, gap);
}
