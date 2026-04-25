"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

function formatPrice(price: string | null | undefined) {
  if (!price) return "$0";
  const cleaned = price.replace(/\$|\./g, "");
  const num = parseInt(cleaned, 10) || 0;
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(num);
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/catalogo/${product.slug}`}
      className="group bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-[var(--border)]"
    >
      <div className="aspect-square relative bg-[var(--border-subtle)]">
        {product.image?.sourceUrl ? (
          <Image
            src={product.image.sourceUrl}
            alt={product.image.altText || product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-[var(--border)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {product.stockStatus === "OUT_OF_STOCK" && (
          <div className="absolute top-3 left-3 bg-[var(--destructive)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
            Agotado
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-[var(--foreground)] text-sm line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-[var(--accent)] transition-colors">
          {product.name}
        </h3>
        <p className="text-lg font-semibold text-[var(--foreground)]">
          {formatPrice(product.price)}
        </p>
        {product.regularPrice && product.regularPrice !== product.price && (
          <p className="text-sm text-[var(--muted)] line-through mt-1">
            {formatPrice(product.regularPrice)}
          </p>
        )}
      </div>
    </Link>
  );
}
