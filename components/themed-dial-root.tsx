"use client";

import { useEffect, useState } from "react";
import { DialRoot } from "dialkit";
import { useTheme } from "next-themes";

export function ThemedDialRoot() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <DialRoot theme={resolvedTheme === "dark" ? "dark" : "light"} />;
}
