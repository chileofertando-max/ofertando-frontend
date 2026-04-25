"use client";

import { useEffect } from "react";

interface MetaPixelProps {
  pixelId: string;
}

export default function MetaPixel({ pixelId }: MetaPixelProps) {
  useEffect(() => {
    if (!pixelId || pixelId.trim() === "") {
      return;
    }

    import("react-facebook-pixel").then((ReactPixel) => {
      const pixel = ReactPixel.default;
      const options = {
        autoConfig: true,
        debug: false,
      };

      pixel.init(pixelId, undefined, options);
      pixel.pageView();
    }).catch(() => {
      // Silently fail if pixel cannot be loaded
    });
  }, [pixelId]);

  return null;
}
