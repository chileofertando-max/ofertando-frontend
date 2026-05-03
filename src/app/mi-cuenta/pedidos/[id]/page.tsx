import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Detalle de pedido | Ofertando",
  description: "Nota de pedido del comprador",
};

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
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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

function getMetodoPago(order: any) {
  if (order?.payment_method === "bacs") {
    return "Transferencia bancaria";
  }

  return order?.payment_method_title || order?.payment_method || "No informado";
}

function getNombreCliente(order: any) {
  const firstName = order?.billing?.first_name || "";
  const lastName = order?.billing?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "Cliente Ofertando";
}

function calcularSubtotalProductos(order: any) {
  if (!Array.isArray(order?.line_items)) return 0;

  return order.line_items.reduce((acc: number, item: any) => {
    return acc + Number(item?.total || 0);
  }, 0);
}

function getTotalEnvio(order: any) {
  if (order?.shipping_total !== undefined) {
    return Number(order.shipping_total || 0);
  }

  if (!Array.isArray(order?.shipping_lines)) return 0;

  return order.shipping_lines.reduce((acc: number, item: any) => {
    return acc + Number(item?.total || 0);
  }, 0);
}

function getTotalDescuento(order: any) {
  return Number(order?.discount_total || 0);
}

function esPedidoDelUsuario(
  order: any,
  emailUsuario: string,
  customerId?: number | null,
) {
  const billingEmail = String(order?.billing?.email || "").toLowerCase().trim();
  const userEmail = String(emailUsuario || "").toLowerCase().trim();
  const orderCustomerId = Number(order?.customer_id || 0);

  return (
    billingEmail === userEmail ||
    Boolean(customerId && orderCustomerId === customerId)
  );
}

async function obtenerCustomerIdPorEmail(email: string, authHeader: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_WP_REST_URL}/wc/v3/customers?email=${encodeURIComponent(
        email,
      )}`,
      {
        headers: { Authorization: authHeader },
        cache: "no-store",
      },
    );

    if (!res.ok) return null;

    const customers = await res.json();

    if (Array.isArray(customers) && customers.length > 0) {
      return Number(customers[0].id);
    }

    return null;
  } catch {
    return null;
  }
}

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12">
        <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Debes iniciar sesión</h1>
          <p className="mt-3 text-gray-600">
            Para ver el detalle de este pedido debes iniciar sesión.
          </p>
          <Link
            href="/login?redirect=/mi-cuenta/pedidos"
            className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 font-semibold text-white"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const authHeader =
    "Basic " +
    Buffer.from(
      `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`,
    ).toString("base64");

  const customerId = await obtenerCustomerIdPorEmail(
    session.user.email,
    authHeader,
  );

  let order: any = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_WP_REST_URL}/wc/v3/orders/${id}`,
      {
        headers: { Authorization: authHeader },
        cache: "no-store",
      },
    );

    if (res.ok) {
      order = await res.json();
    }
  } catch (error) {
    console.error("Error fetching order:", error);
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12">
        <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Pedido no encontrado</h1>
          <p className="mt-3 text-gray-600">
            No pudimos encontrar el pedido solicitado.
          </p>
          <Link
            href="/mi-cuenta/pedidos"
            className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 font-semibold text-white"
          >
            Volver a Mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  if (!esPedidoDelUsuario(order, session.user.email, customerId)) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12">
        <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">No autorizado</h1>
          <p className="mt-3 text-gray-600">
            Este pedido no corresponde al usuario conectado.
          </p>
          <Link
            href="/mi-cuenta/pedidos"
            className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 font-semibold text-white"
          >
            Volver a Mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  const subtotalProductos = calcularSubtotalProductos(order);
  const envio = getTotalEnvio(order);
  const descuento = getTotalDescuento(order);
  const total = Number(order?.total || 0);
  const currency = order?.currency || "CLP";

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 print:bg-white print:px-0 print:py-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: Letter;
              margin: 14mm;
            }

            @media print {
              body {
                background: white !important;
              }

              header,
              nav,
              .no-print {
                display: none !important;
              }

              .print-page {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
              }

              .avoid-break {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          `,
        }}
      />

      <div className="no-print mx-auto mb-5 flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/mi-cuenta/pedidos"
          className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
        >
          ← Volver a Mis pedidos
        </Link>

        <PrintButton />
      </div>

      <main className="print-page mx-auto max-w-5xl rounded-3xl border bg-white p-8 shadow-sm print:p-0">
        <section className="avoid-break border-b pb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-xl font-bold text-white">
                  ✳
                </div>

                <div>
                  <h1 className="text-2xl font-black text-gray-950">
                    Ofertando.cl
                  </h1>
                  <p className="text-sm text-gray-500">
                    Marketplace chileno para emprendedores y compradores
                  </p>
                </div>
              </div>

              <h2 className="mt-7 text-3xl font-black text-gray-950">
                Nota de pedido
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Documento informativo del pedido registrado en Ofertando.cl.
              </p>
            </div>

            <div className="rounded-2xl border bg-gray-50 p-5 text-left sm:min-w-[260px]">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Pedido
              </p>
              <p className="mt-1 text-2xl font-black text-gray-950">
                #{order.number || order.id}
              </p>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <strong>Fecha:</strong> {formatDate(order.date_created)}
                </p>
                <p>
                  <strong>Estado:</strong>{" "}
                  {getStatusLabel(order.status, order.payment_method)}
                </p>
                <p>
                  <strong>Método:</strong> {getMetodoPago(order)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="avoid-break mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border p-5">
            <h3 className="text-lg font-black text-gray-950">
              Datos del comprador
            </h3>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>
                <strong>Nombre:</strong> {getNombreCliente(order)}
              </p>
              <p>
                <strong>Correo:</strong>{" "}
                {order?.billing?.email || "No informado"}
              </p>
              <p>
                <strong>Teléfono:</strong>{" "}
                {order?.billing?.phone || "No informado"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border p-5">
            <h3 className="text-lg font-black text-gray-950">
              Dirección registrada
            </h3>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>
                <strong>Dirección:</strong>{" "}
                {order?.billing?.address_1 || "No informada"}
              </p>
              <p>
                <strong>Comuna:</strong>{" "}
                {order?.billing?.city || "No informada"}
              </p>
              <p>
                <strong>Región:</strong>{" "}
                {order?.billing?.state || "No informada"}
              </p>
              <p>
                <strong>País:</strong> {order?.billing?.country || "CL"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <h3 className="mb-4 text-lg font-black text-gray-950">
            Productos del pedido
          </h3>

          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {Array.isArray(order.line_items) &&
                  order.line_items.map((item: any) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-4 text-gray-900">
                        <strong>{item.name}</strong>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-gray-900">
                        {formatPrice(item.total, currency)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="avoid-break mt-7 grid gap-5 md:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="text-lg font-black text-blue-950">
              Observación del pedido
            </h3>

            <p className="mt-3 text-sm leading-6 text-blue-900">
              Esta nota resume la información registrada para el pedido. Si el
              pago fue por transferencia bancaria, el pedido será gestionado una
              vez recibido y validado el comprobante correspondiente.
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-5">
            <h3 className="text-lg font-black text-gray-950">
              Resumen de pago
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span>Subtotal productos</span>
                <strong>{formatPrice(subtotalProductos, currency)}</strong>
              </div>

              <div className="flex justify-between gap-4">
                <span>Cargo por envío</span>
                <strong>
                  {envio > 0 ? formatPrice(envio, currency) : "Gratis"}
                </strong>
              </div>

              {descuento > 0 && (
                <div className="flex justify-between gap-4 text-green-700">
                  <span>Descuentos</span>
                  <strong>- {formatPrice(descuento, currency)}</strong>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between gap-4 text-xl font-black text-gray-950">
                  <span>Total</span>
                  <span>{formatPrice(total, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {order?.customer_note && (
          <section className="avoid-break mt-7 rounded-2xl border p-5">
            <h3 className="text-lg font-black text-gray-950">
              Nota del cliente
            </h3>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              {order.customer_note}
            </p>
          </section>
        )}

        <footer className="mt-8 border-t pt-5 text-center text-xs leading-5 text-gray-500">
          <p>
            <strong>Ofertando.cl</strong> — Documento generado para consulta del
            comprador.
          </p>
          <p>
            Este documento no reemplaza una boleta o factura tributaria cuando
            corresponda.
          </p>
        </footer>
      </main>
    </div>
  );
}
