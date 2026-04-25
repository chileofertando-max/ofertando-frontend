"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/Button";

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-10 text-center">
          <div className="w-20 h-20 bg-[var(--border-subtle)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <h1 className="text-heading-lg text-[var(--foreground)] mb-3">Tu carrito está vacío</h1>
          <p className="text-[var(--muted-foreground)] mb-8">Agrega productos para continuar con tu compra</p>
          <Link href="/catalogo">
            <Button size="lg">Ver Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-10">
          <h1 className="text-display-sm text-[var(--foreground)] mb-2">Carrito de Compras</h1>
          <p className="text-[var(--muted-foreground)]">{items.length} {items.length === 1 ? "producto" : "productos"} en tu carrito</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-5 p-5 bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors">
                <div className="relative w-24 h-24 bg-[var(--border-subtle)] rounded-xl overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--border)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/catalogo/${item.slug}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors line-clamp-2">
                    {item.name}
                  </Link>
                  <p className="text-[var(--foreground)] font-semibold mt-2">
                    {formatPrice(item.price)}
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="px-3 py-2 text-[var(--muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-2 text-[var(--muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[var(--muted)] hover:text-[var(--destructive)] text-sm flex items-center gap-1 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-[var(--foreground)]">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:pl-4">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 lg:p-8 sticky top-24">
              <h2 className="text-heading-md text-[var(--foreground)] mb-6">Resumen del Pedido</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Subtotal</span>
                  <span className="font-medium">{formatPrice(total())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Envío</span>
                  <span className="font-medium">Calculado al finalizar</span>
                </div>
                <div className="border-t border-[var(--border)] pt-4 flex justify-between">
                  <span className="font-semibold text-[var(--foreground)]">Total</span>
                  <span className="text-xl font-bold text-[var(--foreground)]">{formatPrice(total())}</span>
                </div>
              </div>
              <Link href="/checkout" className="block">
                <Button size="lg" className="w-full">Ir al Checkout</Button>
              </Link>
              <Link href="/catalogo" className="block mt-3">
                <Button variant="ghost" size="lg" className="w-full">Continuar Comprando</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}