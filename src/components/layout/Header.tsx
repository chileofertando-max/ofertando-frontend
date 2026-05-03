"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { CartDrawer } from "@/components/checkout/CartDrawer";
import { Nav } from "@/components/layout/Nav";

export function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: session, status } = useSession();

  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const estaLogeado = status === "authenticated";
  const nombreUsuario = session?.user?.name || "Mi cuenta";

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-105">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>

              <span className="text-xl font-semibold text-gray-900 tracking-tight hidden sm:block">
                Ofertando
              </span>
            </Link>

            <Nav />

            <div className="flex items-center gap-2 sm:gap-3">
              {estaLogeado ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="hidden sm:inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                  >
                    Cerrar sesión
                  </button>

                  <div className="hidden sm:flex flex-col items-end leading-tight max-w-[160px]">
                    <span className="text-[11px] text-gray-500">
                      Usuario
                    </span>
                    <span className="truncate text-[11px] font-bold text-gray-900">
                      {nombreUsuario}
                    </span>
                  </div>

                  <div className="flex sm:hidden flex-col items-end leading-tight max-w-[95px]">
                    <span className="truncate text-[11px] font-bold text-gray-900">
                      {nombreUsuario}
                    </span>
                  </div>
                </div>
              ) : (
                status !== "loading" && (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
                  >
                    Iniciar sesión
                  </Link>
                )
              )}

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-900 hover:bg-gray-100 transition-colors duration-300 active:scale-95"
                aria-label="Abrir carrito"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
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

                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[var(--accent)] text-white text-xs font-semibold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1.5 shadow-sm">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
