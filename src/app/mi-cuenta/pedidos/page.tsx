import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mis Pedidos | Ofertando",
  description: "Historial de pedidos",
};

function formatPrice(price: number | string, currency: string) {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency || "CLP",
    minimumFractionDigits: 0,
  }).format(num);
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    processing: "Procesando",
    completed: "Completado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    failed: "Fallido",
  };
  return labels[status?.toLowerCase()] || status;
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
    failed: "bg-red-100 text-red-800",
  };
  return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
}

export default async function PedidosPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="mb-8">
            <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-4">
              <Link
                href="/mi-cuenta"
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Mi Cuenta
              </Link>
              <span>/</span>
              <span className="text-[var(--foreground)]">Mis Pedidos</span>
            </nav>
            <h1 className="text-display-sm text-[var(--foreground)]">
              Mis Pedidos
            </h1>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-12 text-center">
            <p className="text-[var(--muted-foreground)] mb-4">
              Debes iniciar sesión para ver tus pedidos.
            </p>
            <Link
              href="/login?redirect=/mi-cuenta/pedidos"
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-[var(--accent-hover)]"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const authHeader =
    "Basic " +
    Buffer.from(
      `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`,
    ).toString("base64");

  let customerId: number | null = null;
  try {
    const customerRes = await fetch(
      `${process.env.NEXT_PUBLIC_WP_REST_URL}/wc/v3/customers?email=${encodeURIComponent(
        session.user.email,
      )}`,
      {
        headers: { Authorization: authHeader },
        cache: "no-store",
      },
    );

    if (customerRes.ok) {
      const customers = await customerRes.json();
      if (customers && customers.length > 0) {
        customerId = customers[0].id;
      }
    }
  } catch (error) {
    console.error("Error fetching customer:", error);
  }

  if (!customerId) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="mb-8">
            <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-4">
              <Link
                href="/mi-cuenta"
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Mi Cuenta
              </Link>
              <span>/</span>
              <span className="text-[var(--foreground)]">Mis Pedidos</span>
            </nav>
            <h1 className="text-display-sm text-[var(--foreground)]">
              Mis Pedidos
            </h1>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-12 text-center">
            <p className="text-[var(--muted-foreground)]">
              No se encontró tu perfil de cliente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  let orders: any[] = [];
  try {
    const ordersRes = await fetch(
      `${process.env.NEXT_PUBLIC_WP_REST_URL}/wc/v3/orders?customer=${customerId}&per_page=20`,
      {
        headers: { Authorization: authHeader },
        cache: "no-store",
      },
    );

    if (ordersRes.ok) {
      orders = await ordersRes.json();
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-4">
            <Link
              href="/mi-cuenta"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Mi Cuenta
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">Mis Pedidos</span>
          </nav>
          <h1 className="text-display-sm text-[var(--foreground)]">
            Mis Pedidos
          </h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-12 text-center">
            <div className="w-20 h-20 bg-[var(--border-subtle)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-[var(--muted)]"
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
            <h2 className="text-heading-md text-[var(--foreground)] mb-3">
              No tienes pedidos registrados
            </h2>
            <p className="text-[var(--muted-foreground)] mb-8 max-w-md mx-auto">
              Aquí podrás ver el historial de tus compras una vez que realices
              tu primer pedido.
            </p>
            <Link href="/catalogo">
              <button className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.98]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
                Ir al catálogo
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div
                key={order.id}
                className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Pedido #{order.number}
                    </p>
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {formatPrice(order.total, order.currency)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="border-t border-[var(--border)] pt-4">
                  <p className="text-sm text-[var(--muted-foreground)] mb-2">
                    {new Date(order.date_created).toLocaleDateString("es-CL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <div className="space-y-1">
                    {order.line_items?.map((item: any, idx: number) => (
                      <p key={idx} className="text-sm text-[var(--foreground)]">
                        {item.quantity}x {item.name}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
