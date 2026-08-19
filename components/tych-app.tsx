"use client";

import { TychProvider } from "./tych-store";
import { AppHeader } from "./app-header";
import { CanvasStage } from "./canvas-stage";
import { AppToolbar } from "./app-toolbar";

export function TychApp() {
  return (
    <TychProvider>
      <div className="min-h-dvh bg-background">
        <div className="mx-auto flex min-h-dvh max-w-[720px] flex-col px-6 py-6 sm:px-8 sm:py-8">
          <AppHeader />
          <main className="flex flex-1 flex-col justify-center py-10 sm:py-14">
            <CanvasStage />
            <AppToolbar />
          </main>
          <footer className="pt-6 text-center">
            <a
              href="https://x.com/kiiradesign"
              target="_blank"
              rel="noreferrer"
              className="credit-link"
            >
              Made by @kiiradesign
            </a>
          </footer>
        </div>
      </div>
    </TychProvider>
  );
}
