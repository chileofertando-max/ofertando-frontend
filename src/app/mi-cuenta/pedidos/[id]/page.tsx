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

type ProductoNota = {
  id: string | number;
  nombre: string;
  cantidad: number;
  total: number;
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

function getMeta(order: any, key: string) {
  if (!Array.isArray(order?.meta_data)) return "";

  const item = order.meta_data.find((meta: any) => meta?.key === key);

  if (!item || item.value === undefined || item.value === null) {
    return "";
  }

  return String(item.value);
}

function normalizarNombreProducto(nombre: string) {
  return String(nombre || "Producto")
    .replace(/\s+x\s+\d+\s*$/i, "")
    .trim();
}

function obtenerCantidadDesdeNombre(nombre: string) {
  const match = String(nombre || "").match(/\s+x\s+(\d+)\s*$/i);

  if (match?.[1]) {
    return Number(match[1]);
  }

  return 1;
}

function esLineaEnvio(nombre: string) {
  const n = String(nombre || "").toLowerCase();

  return (
    n.includes("envío") ||
    n.includes("envio") ||
    n.includes("despacho") ||
    n.includes("flete") ||
    n.includes("cargo por envío") ||
    n.includes("cargo por envio")
  );
}

function esLineaDescuento(nombre: string) {
  const n = String(nombre || "").toLowerCase();

  return (
    n.includes("descuento") ||
    n.includes("cupón") ||
    n.includes("cupon") ||
    n.includes("rebaja")
  );
}

function obtenerProductosPedido(order: any): ProductoNota[] {
  const productos: ProductoNota[] = [];

  if (Array.isArray(order?.line_items)) {
    order.line_items.forEach((item: any) => {
      const nombre = String(item?.name || "Producto");
      const cantidad = Number(item?.quantity || 1);
      const total = Number(item?.total || 0);

      productos.push({
        id: `line-${item?.id || nombre}`,
        nombre,
        cantidad: cantidad > 0 ? cantidad : 1,
        total,
      });
    });
  }

  /*
   * En pedidos por transferencia creados desde Ofertando,
   * si WooCommerce no encontró el producto por ID, puede quedar como fee_line.
   */
  if (Array.isArray(order?.fee_lines)) {
    order.fee_lines.forEach((item: any) => {
      const nombreOriginal = String(item?.name || "Producto");
      const total = Number(item?.total || 0);

      if (esLineaEnvio(nombreOriginal) || esLineaDescuento(nombreOriginal)) {
        return;
      }

      productos.push({
        id: `fee-${item?.id || nombreOriginal}`,
        nombre: normalizarNombreProducto(nombreOriginal),
        cantidad: obtenerCantidadDesdeNombre(nombreOriginal),
        total,
      });
    });
  }

  return productos;
}

function calcularSubtotalProductos(order: any) {
  return obtenerProductosPedido(order).reduce((acc, item) => {
    return acc + Number(item.total || 0);
  }, 0);
}

function getTotalEnvio(order: any) {
  let envio = 0;

  if (order?.shipping_total !== undefined) {
    envio += Number(order.shipping_total || 0);
  }

  if (Array.isArray(order?.shipping_lines)) {
    envio += order.shipping_lines.reduce((acc: number, item: any) => {
      return acc + Number(item?.total || 0);
    }, 0);
  }

  if (Array.isArray(order?.fee_lines)) {
    envio += order.fee_lines.reduce((acc: number, item: any) => {
      const nombre = String(item?.name || "");

      if (esLineaEnvio(nombre)) {
        return acc + Number(item?.total || 0);
      }

      return acc;
    }, 0);
  }

  return envio;
}

function getTotalDescuento(order: any) {
  let descuento = Number(order?.discount_total || 0);

  if (Array.isArray(order?.fee_lines)) {
    order.fee_lines.forEach((item: any) => {
      const nombre = String(item?.name || "");
      const total = Number(item?.total || 0);

      if (esLineaDescuento(nombre)) {
        descuento += Math.abs(total);
      }
    });
  }

  return descuento;
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

  const productos = obtenerProductosPedido(order);
  const subtotalProductos = calcularSubtotalProductos(order);
  const envio = getTotalEnvio(order);
  const descuento = getTotalDescuento(order);
  const total = Number(order?.total || 0);
  const currency = order?.currency || "CLP";
  const rut = getMeta(order, "_ofertando_rut_comprador");

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 print:bg-white print:px-0 print:py-0">
      <style>{`
        @page {
          size: Letter;
          margin: 6mm;
        }

        @media print {
          html,
          body {
            background: white !important;
            width: 216mm !important;
            min-height: 279mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden !important;
          }

          .nota-pedido-print,
          .nota-pedido-print * {
            visibility: visible !important;
          }

          .nota-pedido-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            font-size: 9px !important;
            line-height: 1.16 !important;
          }

          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }

          .print-logo {
            width: 34px !important;
            height: 34px !important;
            border-radius: 10px !important;
          }

          .print-page-title {
            font-size: 18px !important;
            line-height: 1.05 !important;
            margin-top: 8px !important;
          }

          .nota-pedido-print h1 {
            font-size: 17px !important;
            line-height: 1.05 !important;
          }

          .nota-pedido-print h2 {
            font-size: 18px !important;
            line-height: 1.05 !important;
          }

          .nota-pedido-print h3 {
            font-size: 11px !important;
            line-height: 1.05 !important;
            margin-bottom: 4px !important;
          }

          .nota-pedido-print p {
            margin-top: 1px !important;
            margin-bottom: 1px !important;
          }

          .print-card {
            padding: 7px !important;
            border-radius: 8px !important;
          }

          .print-section {
            margin-top: 7px !important;
          }

          .print-header {
            padding-bottom: 6px !important;
          }

          .print-grid {
            gap: 7px !important;
          }

          .print-table {
            font-size: 8.8px !important;
          }

          .print-table th,
          .print-table td {
            padding: 3px 5px !important;
            line-height: 1.1 !important;
          }

          .products-table thead {
            display: table-header-group;
          }

          .products-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .products-table tbody tr:nth-child(20n + 21) {
            break-before: page;
            page-break-before: always;
          }

          .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-observacion {
            padding: 7px !important;
          }

          .print-observacion p {
            font-size: 8.5px !important;
            line-height: 1.15 !important;
          }

          .print-total {
            font-size: 15px !important;
          }

          .print-footer {
            margin-top: 6px !important;
            padding-top: 5px !important;
            font-size: 7.8px !important;
            line-height: 1.12 !important;
          }
        }
      `}</style>

      <div className="no-print mx-auto mb-5 flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/mi-cuenta/pedidos"
          className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
        >
          ← Volver a Mis pedidos
        </Link>

        <PrintButton />
      </div>

      <main className="nota-pedido-print mx-auto max-w-5xl rounded-3xl border bg-white p-8 shadow-sm">
        <section className="print-header avoid-break border-b pb-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="print-logo flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-xl font-bold text-white">
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

              <h2 className="print-page-title mt-6 text-3xl font-black text-gray-950">
                Nota de pedido
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Documento informativo del pedido registrado en Ofertando.cl.
              </p>
            </div>

            <div className="print-card rounded-2xl border bg-gray-50 p-5 text-left sm:min-w-[260px]">
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

        <section className="print-section avoid-break mt-6 grid gap-5 md:grid-cols-2 print-grid">
          <div className="print-card rounded-2xl border p-5">
            <h3 className="text-lg font-black text-gray-950">
              Datos del comprador
            </h3>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>
                <strong>Nombre:</strong> {getNombreCliente(order)}
              </p>

              {rut && (
                <p>
                  <strong>RUT:</strong> {rut}
                </p>
              )}

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

          <div className="print-card rounded-2xl border p-5">
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

        <section className="print-section mt-7">
          <h3 className="mb-4 text-lg font-black text-gray-950">
            Productos del pedido
          </h3>

          <div className="overflow-hidden rounded-2xl border">
            <table className="products-table print-table w-full border-collapse text-sm">
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
                {productos.length > 0 ? (
                  productos.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-4 text-gray-900">
                        <strong>{item.nombre}</strong>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {item.cantidad}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-gray-900">
                        {formatPrice(item.total, currency)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t">
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      No se encontraron productos asociados a este pedido.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="print-section avoid-break mt-7 grid gap-5 md:grid-cols-[1fr_330px] print-grid">
          <div className="print-card print-observacion rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="text-lg font-black text-blue-950">
              Observación del pedido
            </h3>

            <p className="mt-3 text-sm leading-6 text-blue-900">
              Esta nota resume la información registrada para el pedido. Si el
              pago fue por transferencia bancaria, el pedido será gestionado una
              vez recibido y validado el comprobante correspondiente.
            </p>
          </div>

          <div className="print-card rounded-2xl border bg-gray-50 p-5">
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
                <div className="print-total flex justify-between gap-4 text-xl font-black text-gray-950">
                  <span>Total</span>
                  <span>{formatPrice(total, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {order?.customer_note && (
          <section className="print-section avoid-break mt-7 rounded-2xl border p-5">
            <h3 className="text-lg font-black text-gray-950">
              Nota del cliente
            </h3>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              {order.customer_note}
            </p>
          </section>
        )}

        <footer className="print-footer mt-7 border-t pt-4 text-center text-xs leading-5 text-gray-500">
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
