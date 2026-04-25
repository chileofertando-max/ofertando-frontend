import { Suspense } from "react";
import type { Metadata } from "next";
import ConfirmacionContent from "./ConfirmacionContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmación de Compra | Ofertando",
  description: "Tu pedido ha sido confirmado",
};

export default function ConfirmacionPage() {
  return (
      <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="w-16 h-16 bg-[var(--success-muted)] rounded-full mx-auto" />
          <div className="h-8 bg-[var(--border)] rounded w-1/2 mx-auto" />
          <div className="h-4 bg-[var(--border)] rounded w-3/4 mx-auto" />
        </div>
        <p className="text-[var(--muted)] mt-4">Cargando...</p>
      </div>
    }>
      <ConfirmacionContent />
    </Suspense>
  );
}
