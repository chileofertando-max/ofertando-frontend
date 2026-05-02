import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finalizar compra | Ofertando",
  description: "Completa tus datos y elige tu método de pago en Ofertando.cl",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-10">
          <h1 className="text-display-sm text-[var(--foreground)] mb-2">
            Finalizar compra
          </h1>

          <p className="text-[var(--muted-foreground)]">
            Completa tus datos, revisa el despacho y elige tu método de pago.
          </p>
        </div>

        <CheckoutForm />
      </div>
    </div>
  );
}
