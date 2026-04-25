import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mi Cuenta | Ofertando",
  description: "Revisa tus pedidos",
};

export default function MiCuentaPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-10">
          <h1 className="text-display-sm text-[var(--foreground)] mb-2">
            Mi Cuenta
          </h1>
          <p className="text-[var(--muted-foreground)]">Revisa tus pedidos</p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/mi-cuenta/pedidos"
            className="group bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 max-w-md w-full"
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-[var(--accent-muted)] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)] transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-[var(--accent)] group-hover:text-white transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-heading-md text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                  Mis Pedidos
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Ver historial y estado de tus pedidos
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
