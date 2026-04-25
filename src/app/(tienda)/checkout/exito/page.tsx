"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { usePixel } from "@/hooks/usePixel";
import { Button } from "@/components/ui/Button";

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(price);
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const buyOrder = searchParams.get("buyOrder") || "—";
  const amount = searchParams.get("amount") || "0";
  const { clearCart } = useCartStore();
  const { trackPurchase } = usePixel();

  useEffect(() => {
    clearCart();
    const numericAmount = parseInt(amount, 10);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      trackPurchase(buyOrder, numericAmount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-8 lg:p-10 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-[var(--success-muted)] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-display-sm text-[var(--success)] mb-4">
          ¡Pago Exitoso!
        </h1>
        <p className="text-[var(--muted-foreground)] mb-8">
          Tu pedido ha sido procesado correctamente.
        </p>

        <div className="bg-[var(--background)] rounded-xl p-6 mb-8 text-left border border-[var(--border-subtle)]">
          <h2 className="font-semibold text-[var(--foreground)] mb-4">Resumen de tu compra</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Número de Orden</span>
              <span className="font-medium text-[var(--foreground)]">{buyOrder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Monto pagado</span>
              <span className="font-bold text-[var(--foreground)]">{formatPrice(parseInt(amount, 10))}</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Te hemos enviado un correo de confirmación con los detalles de tu pedido.
          </p>
        </div>

        <Link href="/catalogo">
          <Button size="lg" className="w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Volver al catálogo
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function ExitoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}