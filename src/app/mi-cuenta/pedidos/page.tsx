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
  const cleanStatus = status?.toLowerCase();

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
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    "on-hold": "bg-orange-100 text-orange-800 border-orange-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    refunded: "bg-gray-100 text-gray-800 border-gray-200",
    failed: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
  );
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
  const email = order?.billing?.email || "No informado";
  const telefono = order?.billing?.phone || "No informado";
  const direccion = order?.billing?.address_1 || "No informada";
  const comuna = order?.billing?.city || "No informada";
  const region = order?.billing?.state || "No informada";
  const productos = getProductosTexto(order);

  return `Hola Ofertando.cl, quiero enviar el comprobante de mi compra por transferencia bancaria.

DATOS DEL PEDIDO
Número de pedido: ${numeroPedido}
Monto total transferido: ${total}

PRODUCTOS COMPRADOS
${productos}

DATOS DEL COMPRADOR
Nombre: ${nombre}
Correo: ${email}
Teléfono: ${telefono}
Dirección: ${direccion}
Comuna: ${comuna}
Región: ${region}

Adjunto comprobante de transferencia para validar mi pedido.`;
}

function generarWhatsappUrl(order: any) {
  const mensaje = generarMensajeWhatsapp(order);

  return `https://wa.me/${WHATSAPP_OFERTANDO}?text=${encodeURIComponent(
    mensaje,
  )}`;
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

          <p className="mt-2 text-[var(--muted-foreground)]">
            Revisa el estado de tus compras y gestiona el envío de comprobantes
            cuando el pago sea por transferencia bancaria.
          </p>
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
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
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
                Ir al catálogo
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border-subtle)]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                      Pedido
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                      Fecha
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                      Estado
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-600">
                      Total
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                      Método
                    </th>
                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-600">
                      WhatsApp
                    </th>
                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-600">
                      Ver
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-subtle)] bg-white">
                  {orders.map((order: any) => {
                    const transferenciaPendiente =
                      esTransferenciaPendiente(order);

                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-[var(--foreground)]">
                          #{order.number || order.id}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-[var(--muted-foreground)]">
                          {formatDate(order.date_created)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            {getStatusLabel(order.status, order.payment_method)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-[var(--foreground)]">
                          {formatPrice(order.total, order.currency)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-[var(--foreground)]">
                          {getMetodoPago(order)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-center">
                          {transferenciaPendiente ? (
                            <a
                              href={generarWhatsappUrl(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-green-700"
                            >
                              Enviar comprobante
                            </a>
                          ) : (
                            <span className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700">
                              Enviado
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-center">
                          <Link
                            href={`/mi-cuenta/pedidos/${order.id}`}
                            title="Ver pedido"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100 hover:text-black"
                          >
                            <span className="sr-only">Ver pedido</span>
                            🔍
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[var(--border-subtle)] bg-gray-50 px-5 py-3 text-xs text-gray-500">
              El botón de WhatsApp aparece solo cuando el pedido fue realizado
              por transferencia bancaria y sigue pendiente de comprobante.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
