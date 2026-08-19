"use client";

import { MorphIcon } from "morphicons/react";
import { Moon, Sun } from "lucide";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light" : "Switch to dark"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="geist-focus-visible grid size-8 place-items-center rounded-[6px] text-foreground transition-transform duration-150 ease-out active:scale-95"
    >
      {mounted ? (
        <MorphIcon
          icon={isDark ? Moon : Sun}
          size={18}
          strokeWidth={1.75}
          spring="snappy"
          reducedMotion="user"
        />
      ) : (
        <span className="size-[18px]" />
      )}
    </button>
  );
}
