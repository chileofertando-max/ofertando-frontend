"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCartStore } from "@/store/cart";
import { usePixel } from "@/hooks/usePixel";
import type { Product } from "@/types/product";

interface ProductDetailProps {
  product: Product;
}

function parsePrice(price: string | null | undefined): number {
  if (!price) return 0;
  const cleaned = price.replace(/\$|\./g, "");
  return parseInt(cleaned, 10) || 0;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(price);
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const { trackAddToCart, trackViewContent } = usePixel();

  useEffect(() => {
    trackViewContent({
      id: product.id,
      name: product.name,
      price: parsePrice(product.price),
    });
  }, [product, trackViewContent]);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      databaseId: product.databaseId,
      slug: product.slug,
      name: product.name,
      price: parsePrice(product.price),
      image: product.image?.sourceUrl || "",
      quantity,
    });

    trackAddToCart({
      id: product.id,
      name: product.name,
      price: parsePrice(product.price),
    });
  };

  const whatsappMessage = encodeURIComponent(
    `Hola, me interesa el producto: ${product.name}`,
  );
  const whatsappUrl = `https://wa.me/56978953903?text=${whatsappMessage}`;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        {product.productCategories?.nodes?.[0] && (
          <Badge variant="accent" className="text-xs">
            {product.productCategories.nodes[0].name}
          </Badge>
        )}
        {product.stockStatus === "OUT_OF_STOCK" && (
          <Badge variant="error">Agotado</Badge>
        )}
      </div>

      <h1 className="text-display-sm md:text-display-md text-[var(--foreground)] mb-4 leading-tight">
        {product.name}
      </h1>

      <div className="mb-6">
        <p className="text-3xl md:text-4xl font-semibold text-[var(--foreground)]">
          {formatPrice(parsePrice(product.price))}
        </p>
        {product.regularPrice && product.regularPrice !== product.price && (
          <p className="text-lg text-[var(--muted)] line-through mt-1">
            {formatPrice(parsePrice(product.regularPrice))}
          </p>
        )}
      </div>

      <div
        className="text-[var(--muted-foreground)] mb-8 leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: product.shortDescription || "",
        }}
      />

      {product.stockStatus === "IN_STOCK" && (
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-3 text-[var(--muted-foreground)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 12H4"
                />
              </svg>
            </button>
            <span className="px-5 py-3 font-medium text-[var(--foreground)] min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 py-3 text-[var(--muted-foreground)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          <span className="text-sm text-[var(--muted-foreground)]">
            Disponibles
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-auto">
        {product.stockStatus === "IN_STOCK" ? (
          <Button onClick={handleAddToCart} size="lg" className="flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            Agregar al carrito
          </Button>
        ) : (
          <Button disabled size="lg" className="flex-1">
            Agotado
          </Button>
        )}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button variant="secondary" size="lg" className="w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-[var(--success)]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Consultar por WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
