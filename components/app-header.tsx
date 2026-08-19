"use client";

import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <h1 className="text-[18px] font-semibold tracking-tight text-foreground">
          Tych
        </h1>
        <ThemeToggle />
      </div>
      <a
        href="https://x.com/kiiradesign"
        target="_blank"
        rel="noreferrer"
        className="credit-link text-[13px] text-[var(--panel-text-muted)]"
      >
        Made by @kiiradesign
      </a>
    </header>
  );
}
