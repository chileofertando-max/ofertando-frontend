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

const WHATSAPP_OFERTANDO = "56978953903";

function formatPrice(price: number | string, currency: string = "CLP") {
  const num = typeof price === "string" ? parseFloat(price) : price;

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency || "CLP",
    minimumFractionDigits: 0,
  }).format(Number.isFinite(num) ? num : 0);
}

function formatDate(date: string) {
  if (!date) return "Sin fecha";

  return new Date(date).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getStatusLabel(status: string, paymentMethod?: string) {
  const cleanStatus = String(status || "").toLowerCase();

  if (
    paymentMethod === "bacs" &&
    (cleanStatus === "on-hold" || cleanStatus === "pending")
  ) {
    return "Pendiente de transferencia";
  }

  const labels: Record<string, string> = {
    pending: "Pendiente",
    "on-hold": "Pendiente de transferencia",
    processing: "Procesando",
    completed: "Completado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    failed: "Fallido",
  };

  return labels[cleanStatus] || status || "Sin estado";
}

function getStatusColor(status: string) {
  const cleanStatus = String(status || "").toLowerCase();

  const colors: Record<string, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    "on-hold": "border-orange-200 bg-orange-50 text-orange-800",
    processing: "border-blue-200 bg-blue-50 text-blue-800",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
    cancelled: "border-red-200 bg-red-50 text-red-800",
    refunded: "border-slate-200 bg-slate-50 text-slate-700",
    failed: "border-red-200 bg-red-50 text-red-800",
  };

  return colors[cleanStatus] || "border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusDotColor(status: string) {
  const cleanStatus = String(status || "").toLowerCase();

  const colors: Record<string, string> = {
    pending: "bg-amber-500",
    "on-hold": "bg-orange-500",
    processing: "bg-blue-500",
    completed: "bg-emerald-500",
    cancelled: "bg-red-500",
    refunded: "bg-slate-500",
    failed: "bg-red-500",
  };

  return colors[cleanStatus] || "bg-slate-400";
}

function getMetodoPago(order: any) {
  const method = order?.payment_method;
  const title = order?.payment_method_title;

  if (method === "bacs") {
    return "Transferencia bancaria";
  }

  return title || method || "No informado";
}

function esTransferenciaPendiente(order: any) {
  const status = order?.status?.toLowerCase();
  const method = order?.payment_method;

  return method === "bacs" && (status === "on-hold" || status === "pending");
}

function getNombreCliente(order: any) {
  const firstName = order?.billing?.first_name || "";
  const lastName = order?.billing?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "Cliente Ofertando";
}

function getProductosTexto(order: any) {
  if (!Array.isArray(order?.line_items) || order.line_items.length === 0) {
    return "Productos no informados";
  }

  return order.line_items
    .map((item: any) => {
      const quantity = item?.quantity || 1;
      const name = item?.name || "Producto";
      const total = item?.total ? formatPrice(item.total, order.currency) : "";

      return `- ${name} x ${quantity}${total ? ` - ${total}` : ""}`;
    })
    .join("\n");
}

function generarMensajeWhatsapp(order: any) {
  const numeroPedido = order?.number || order?.id || "";
  const total = formatPrice(order?.total || 0, order?.currency || "CLP");
  const nombre = getNombreCliente(order);

  return `Hola Ofertando.cl, realicé una compra por transferencia bancaria.

DATOS DEL PEDIDO
Número de pedido: ${numeroPedido}
Monto total a transferir: ${total}

DATOS BANCARIOS
Nombre: OFERTANDO SpA
RUT: 77.156.739-8
Banco: Banco de Chile
Tipo de cuenta: Cuenta Vista
Número de cuenta: 172422241
Correo: chileofertando@gmail.com

DATOS DEL COMPRADOR
Nombre: ${nombre}

Adjunto comprobante de transferencia para validar mi pedido.`;
}

function generarWhatsappUrl(order: any) {
  const mensaje = generarMensajeWhatsapp(order);

  return `https://wa.me/${WHATSAPP_OFERTANDO}?text=${encodeURIComponent(
    mensaje,
  )}`;
}

function SunIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="12" fill="#fbbf24" />
      <circle cx="32" cy="32" r="7" fill="#f59e0b" />

      <path
        d="M32 4V13"
        stroke="#fbbf24"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M32 51V60"
        stroke="#fbbf24"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M4 32H13"
        stroke="#fbbf24"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M51 32H60"
        stroke="#fbbf24"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M12.2 12.2L18.6 18.6"
        stroke="#fbbf24"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M45.4 45.4L51.8 51.8"
        stroke="#fbbf24"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M51.8 12.2L45.4 18.6"
        stroke="#fbbf24"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M18.6 45.4L12.2 51.8"
        stroke="#fbbf24"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M20.6 6.9L24.1 15.2"
        stroke="#fbbf24"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M39.9 48.8L43.4 57.1"
        stroke="#fbbf24"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M6.9 43.4L15.2 39.9"
        stroke="#fbbf24"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M48.8 24.1L57.1 20.6"
        stroke="#fbbf24"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SunCircleIcon({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M40 8C57.673 8 72 22.327 72 40"
        stroke="#ec4899"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <path
        d="M72 40C72 57.673 57.673 72 40 72"
        stroke="#ec4899"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <path
        d="M40 72C22.327 72 8 57.673 8 40C8 22.327 22.327 8 40 8"
        stroke="#ec4899"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="13 12"
      />

      <g transform="translate(20 20) scale(0.63)">
        <circle cx="32" cy="32" r="12" fill="#fbbf24" />
        <circle cx="32" cy="32" r="7" fill="#f59e0b" />

        <path
          d="M32 4V13"
          stroke="#fbbf24"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M32 51V60"
          stroke="#fbbf24"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M4 32H13"
          stroke="#fbbf24"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M51 32H60"
          stroke="#fbbf24"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M12.2 12.2L18.6 18.6"
          stroke="#fbbf24"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M45.4 45.4L51.8 51.8"
          stroke="#fbbf24"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M51.8 12.2L45.4 18.6"
          stroke="#fbbf24"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M18.6 45.4L12.2 51.8"
          stroke="#fbbf24"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.4}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35m1.1-5.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
      />
    </svg>
  );
}

function WhatsappIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20.52 11.86A8.5 8.5 0 0 1 7.8 19.25L3.75 20.5l1.31-3.93A8.5 8.5 0 1 1 20.52 11.86Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.75c.17-.39.36-.4.53-.4h.45c.14 0 .36.05.55.42.2.37.66 1.28.72 1.37.05.09.09.2.02.33-.07.14-.11.22-.22.34-.11.13-.23.28-.33.37-.11.11-.23.23-.1.45.13.22.58.95 1.25 1.54.86.77 1.59 1.01 1.81 1.12.22.11.35.09.48-.06.14-.16.55-.64.7-.86.14-.22.29-.18.49-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.09.05.53-.13 1.04-.18.51-1.07.98-1.49 1.01-.38.03-.86.04-1.39-.09-.32-.08-.73-.24-1.25-.47-2.21-.96-3.65-3.19-3.76-3.34-.11-.15-.9-1.2-.9-2.28s.57-1.62.77-1.85Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default async function PedidosPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8">
            <nav className="mb-4 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Link
                href="/mi-cuenta"
                className="transition-colors hover:text-[var(--foreground)]"
              >
                Mi Cuenta
              </Link>
              <span>/</span>
              <span className="text-[var(--foreground)]">Mis Pedidos</span>
            </nav>

            <div className="flex items-center gap-4">
              <SunIcon className="h-12 w-12" />
              <h1 className="text-display-sm text-[var(--foreground)]">
                Mis Pedidos
              </h1>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-12 text-center shadow-sm">
            <p className="mb-4 text-[var(--muted-foreground)]">
              Debes iniciar sesión para ver tus pedidos.
            </p>

            <Link
              href="/login?redirect=/mi-cuenta/pedidos"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-[var(--accent-hover)]"
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
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8">
            <nav className="mb-4 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Link
                href="/mi-cuenta"
                className="transition-colors hover:text-[var(--foreground)]"
              >
                Mi Cuenta
              </Link>
              <span>/</span>
              <span className="text-[var(--foreground)]">Mis Pedidos</span>
            </nav>

            <div className="flex items-center gap-4">
              <SunIcon className="h-12 w-12" />
              <h1 className="text-display-sm text-[var(--foreground)]">
                Mis Pedidos
              </h1>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-12 text-center shadow-sm">
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
      `${process.env.NEXT_PUBLIC_WP_REST_URL}/wc/v3/orders?customer=${customerId}&per_page=20&orderby=date&order=desc`,
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8">
          <nav className="mb-4 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Link
              href="/mi-cuenta"
              className="transition-colors hover:text-[var(--foreground)]"
            >
              Mi Cuenta
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">Mis Pedidos</span>
          </nav>

          <div className="flex items-center gap-4">
            <SunIcon className="h-14 w-14" />

            <div>
              <h1 className="text-display-sm text-[var(--foreground)]">
                Mis Pedidos
              </h1>

              <p className="mt-2 max-w-3xl text-[var(--muted-foreground)]">
                Revisa el estado de tus compras y gestiona el envío de
                comprobantes cuando el pago sea por transferencia bancaria.
              </p>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-12 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--border-subtle)]">
              <SunIcon className="h-12 w-12" />
            </div>

            <h2 className="mb-3 text-heading-md text-[var(--foreground)]">
              No tienes pedidos registrados
            </h2>

            <p className="mx-auto mb-8 max-w-md text-[var(--muted-foreground)]">
              Aquí podrás ver el historial de tus compras una vez que realices
              tu primer pedido.
            </p>

            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.98]"
            >
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <SunCircleIcon className="h-16 w-16 flex-none" />

                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Historial de compras
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Consulta el estado y gestión de tus pedidos.
                  </p>
                </div>
              </div>

              <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <SunCircleIcon className="h-10 w-10 flex-none" />

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Total de pedidos
                  </p>
                  <p className="text-2xl font-black text-pink-500">
                    {orders.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto px-6 pt-6">
              <table className="w-full min-w-[980px] overflow-hidden rounded-2xl border border-slate-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-black text-slate-600">
                      Número de pedido
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-slate-600">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-slate-600">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-slate-600">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-slate-600">
                      Forma de pago
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-black text-slate-600">
                      Comprob de pago
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-black text-slate-600">
                      Detalle
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {orders.map((order: any) => {
                    const transferenciaPendiente =
                      esTransferenciaPendiente(order);

                    return (
                      <tr
                        key={order.id}
                        className="transition-colors duration-200 hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-6 py-6 text-sm font-black text-slate-950">
                          #{order.number || order.id}
                        </td>

                        <td className="whitespace-nowrap px-6 py-6 text-sm font-semibold text-slate-800">
                          {formatDate(order.date_created)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-6">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${getStatusDotColor(
                                order.status,
                              )}`}
                            />
                            {getStatusLabel(order.status, order.payment_method)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-6 text-sm font-black text-slate-950">
                          {formatPrice(order.total, order.currency)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-6 text-sm font-semibold text-slate-800">
                          {getMetodoPago(order)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-6 text-center">
                          {transferenciaPendiente ? (
                            <a
                              href={generarWhatsappUrl(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
                            >
                              <WhatsappIcon className="h-4 w-4" />
                              Enviar
                            </a>
                          ) : (
                            <span className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600">
                              Enviado
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-6 text-center">
                          <Link
                            href={`/mi-cuenta/pedidos/${order.id}`}
                            title="Ver detalle del pedido"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98]"
                          >
                            <SearchIcon className="h-4 w-4" />
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mx-6 mb-6 mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-400 text-xs font-black text-white">
                  i
                </div>

                <span>
                  El botón de comprobante aparece solo cuando el pedido fue
                  realizado por transferencia bancaria y sigue pendiente.
                </span>
              </div>

              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-800 transition hover:bg-slate-100"
              >
                Seguir comprando
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
