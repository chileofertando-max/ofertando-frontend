"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/types/product";

interface ProductGalleryProps {
  mainImage: ProductImage | null;
  galleryImages: ProductImage[];
  productName: string;
}

export function ProductGallery({ mainImage, galleryImages, productName }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState<ProductImage | null>(mainImage);

  const allImages = [mainImage, ...galleryImages].filter(Boolean) as ProductImage[];

  if (allImages.length === 0 || !activeImage?.sourceUrl) {
    return (
      <div className="relative aspect-square bg-[var(--border-subtle)] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-16 h-16 text-[var(--border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square bg-[var(--border-subtle)] rounded-2xl overflow-hidden">
        <Image
          src={activeImage.sourceUrl}
          alt={activeImage.altText || productName}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(image)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                activeImage.sourceUrl === image.sourceUrl
                  ? "border-[var(--accent)] shadow-sm"
                  : "border-[var(--border)] hover:border-[var(--muted)]"
              }`}
            >
              <Image
                src={image.sourceUrl}
                alt={image.altText || `${productName} - Imagen ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}