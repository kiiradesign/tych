"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getTychLayout } from "@/lib/layout";
import { zoomAt } from "@/lib/crop";
import { disposeSlot, loadSlotImage } from "@/lib/images";
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
  replaceSlot: (index: number, file: File) => Promise<void>;
  clearSlot: (index: number) => void;
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

export function TychProvider({ children }: { children: ReactNode }) {
  const [count, setCountState] = useState<PanelCount>(4);
  const [gap, setGap] = useState<GapPx>(3);
  const [slots, setSlots] = useState<Array<SlotImage | null>>(() => emptySlots(4));
  const [crops, setCrops] = useState<CropState[]>(() => emptyCrops(4));
  const [selected, setSelected] = useState(0);
  const [previewGround, setPreviewGround] = useState<PreviewGround>("checker");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const images = files.filter(Boolean);
      if (images.length === 0) return;

      const empty = slots.every((s) => !s);
      const inferred =
        empty && startIndex === undefined
          ? (Math.min(4, Math.max(2, images.length)) as PanelCount)
          : count;
      const firstEmpty = slots.findIndex((s) => !s);
      const begin = startIndex ?? (firstEmpty === -1 ? selected : firstEmpty);

      try {
        if (inferred !== count) setCountState(inferred);

        const loaded = await Promise.all(
          images.slice(0, Math.max(0, inferred - begin)).map(async (file, i) => ({
            index: begin + i,
            image: await loadSlotImage(file),
          })),
        );

        setSlots((prev) => {
          const next = Array.from(
            { length: inferred },
            (_, i) => prev[i] ?? null,
          );
          prev.slice(inferred).forEach(disposeSlot);
          for (const { index, image } of loaded) {
            disposeSlot(next[index] ?? null);
            next[index] = image;
          }
          return next;
        });
        setCrops((prev) => {
          const reset = new Set(loaded.map((item) => item.index));
          return Array.from({ length: inferred }, (_, i) =>
            reset.has(i) ? { ...DEFAULT_CROP } : (prev[i] ?? { ...DEFAULT_CROP }),
          );
        });
        if (loaded[0]) setSelected(loaded[0].index);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read those files.");
      }
    },
    [count, selected, slots],
  );

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

  const clearSlot = useCallback((index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      disposeSlot(next[index] ?? null);
      next[index] = null;
      return next;
    });
    setCrops((prev) => prev.map((c, i) => (i === index ? { ...DEFAULT_CROP } : c)));
  }, []);

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
      replaceSlot,
      clearSlot,
      setExporting,
      setError,
    }),
    [
      addFiles,
      clearSlot,
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
