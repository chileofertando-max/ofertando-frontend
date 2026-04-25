"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RechazadoPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-8 lg:p-10 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-[var(--destructive-muted)] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--destructive)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-display-sm text-[var(--destructive)] mb-4">
          ¡Pago Rechazado!
        </h1>
        <p className="text-[var(--muted-foreground)] mb-8">
          Tu pago no pudo ser procesado o fue anulado. No se han realizado cargos en tu cuenta.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/checkout">
            <Button size="lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
              Intentar nuevamente
            </Button>
          </Link>
          <Link href="/catalogo">
            <Button variant="secondary" size="lg">
              Volver al catálogo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}