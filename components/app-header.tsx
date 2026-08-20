"use client";

export function AppHeader() {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-semibold leading-none tracking-tight text-[var(--ds-gray-1000)]">
          Tych
        </h1>
        <p className="panel-copy mt-1.5 max-w-[22rem]">
          Make image grids for X(Twitter) posts.
        </p>
      </div>
      <a
        href="https://x.com/kiiradesign"
        target="_blank"
        rel="noreferrer"
        className="credit-link shrink-0 pt-2"
      >
        @kiiradesign
      </a>
    </header>
  );
}
