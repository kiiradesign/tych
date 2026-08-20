"use client";

import { DialRoot } from "dialkit";
import { useEffect, useState } from "react";

export function ThemedDialRoot() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <DialRoot theme="dark" />;
}
