"use client";

import { MorphIcon } from "morphicons/react";
import { Moon, Sun } from "lucide";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { LisseButton } from "./lisse-button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <LisseButton
      radius={6}
      aria-label={isDark ? "Switch to light" : "Switch to dark"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      wrapClassName="-mr-1"
      className="icon-button geist-focus-visible grid size-9 place-items-center"
    >
      {mounted ? (
        <MorphIcon
          icon={isDark ? Moon : Sun}
          size={20}
          strokeWidth={1.5}
          spring="snappy"
          reducedMotion="user"
        />
      ) : (
        <span className="size-[18px]" />
      )}
    </LisseButton>
  );
}
