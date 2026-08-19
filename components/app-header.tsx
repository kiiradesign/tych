"use client";

import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold leading-none tracking-tight text-foreground">
          Tych
        </h1>
        <a
          href="https://x.com/kiiradesign"
          target="_blank"
          rel="noreferrer"
          className="credit-link mt-2 inline-block text-[13px] leading-none text-foreground"
        >
          Made by @kiiradesign
        </a>
      </div>
      <ThemeToggle />
    </header>
  );
}
