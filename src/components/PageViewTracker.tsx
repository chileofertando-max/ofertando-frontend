"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePixel } from "@/hooks/usePixel";

export function PageViewTracker() {
  const pathname = usePathname();
  const { trackPageView } = usePixel();

  useEffect(() => {
    trackPageView();
  }, [pathname, trackPageView]);

  return null;
}
