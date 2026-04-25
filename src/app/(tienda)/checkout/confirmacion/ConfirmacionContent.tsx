"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { usePixel } from "@/hooks/usePixel";
import { Button } from "@/components/ui/Button";

interface OrderData {
  orderId: string;
  amount: number;
  cardNumber: string;
  transactionDate: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const token_ws = searchParams.get("token_ws");
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { clearCart } = useCartStore();
  const { trackPurchase } = usePixel();

  useEffect(() => {
    if (!token_ws) {
      setError("Token de transacción no encontrado");
      setLoading(false);
      return;
    }

    const storedOrderData = sessionStorage.getItem("pendingOrder");
    if (!storedOrderData) {
      setError("Datos del pedido no encontrados");
      setLoading(false);
      return;
    }

    const commitTransaction = async () => {
      try {
        const response = await fetch("/api/transbank/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token_ws }),
        });

        const data = await response.json();

        if (data.success) {
          const parsedOrder = JSON.parse(storedOrderData);
          setOrderData({
            orderId: parsedOrder.orderId || `ORD-${Date.now()}`,
            amount: data.data.amount || parsedOrder.amount,
            cardNumber: data.data.cardNumber || "****",
            transactionDate: data.data.transactionDate || new Date().toISOString(),
          });

          clearCart();
          sessionStorage.removeItem("pendingOrder");
          sessionStorage.removeItem("orderData");

          trackPurchase(parsedOrder.orderId || "unknown", parsedOrder.amount);
        } else {
          setError(data.error || "La transacción fue rechazada");
        }
      } catch {
        setError("Error al confirmar la transacción");
      } finally {
        setLoading(false);
      }
    };

    commitTransaction();
  }, [token_ws, clearCart, trackPurchase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-heading-md text-[var(--foreground)] mb-2">Confirmando tu pago</h2>
          <p className="text-[var(--muted-foreground)]">Por favor espera un momento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-8 text-center">
          <div className="w-16 h-16 bg-[var(--destructive-muted)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--destructive)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-heading-lg text-[var(--foreground)] mb-3">Error en el pago</h1>
          <p className="text-[var(--muted-foreground)] mb-8">{error}</p>
          <Link href="/checkout">
            <Button size="lg">Volver al checkout</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-8 lg:p-10 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-[var(--success-muted)] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-display-sm text-[var(--foreground)] mb-3">
          ¡Gracias por tu compra!
        </h1>
        <p className="text-[var(--muted-foreground)] mb-8">
          Tu pedido ha sido procesado correctamente.
        </p>

        {orderData && (
          <div className="bg-[var(--background)] rounded-xl p-6 mb-8 text-left border border-[var(--border-subtle)]">
            <h2 className="font-semibold text-[var(--foreground)] mb-4">Detalles de tu pedido</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Número de orden:</span>
                <span className="font-semibold text-[var(--foreground)]">{orderData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Monto pagado:</span>
                <span className="font-semibold text-[var(--foreground)]">{formatPrice(orderData.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Tarjeta:</span>
                <span className="font-medium text-[var(--muted)]">**** {orderData.cardNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Fecha:</span>
                <span className="font-medium text-[var(--muted)]">
                  {new Date(orderData.transactionDate).toLocaleString("es-CL", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-[var(--muted)] mb-8">
          Te hemos enviado un correo de confirmación con los detalles de tu pedido.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/catalogo">
            <Button variant="secondary" size="lg" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Seguir comprando
            </Button>
          </Link>
          <Link href="/mi-cuenta/pedidos">
            <Button size="lg" className="w-full">
              Ver mis pedidos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}