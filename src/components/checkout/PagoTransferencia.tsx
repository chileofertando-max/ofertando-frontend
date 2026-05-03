"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";

type ProductoCarrito = {
  id?: string | number;
  nombre?: string;
  name?: string;
  precio?: number;
  price?: number;
  cantidad?: number;
  quantity?: number;
  imagen?: string;
  image?: string;
  subtotal?: number;
};

type Comprador = {
  nombre?: string;
  nombres?: string;
  apellido?: string;
  email?: string;
  correo?: string;
  telefono?: string;
  rut?: string;
  direccion?: string;
  ciudad?: string;
  region?: string;

  subtotal?: number;
  envio?: number;
  descuento?: number;
  cupon?: string;
  total?: number;
};

type PagoTransferenciaProps = {
  carrito: ProductoCarrito[];
  comprador: Comprador;
};

type OrdenCreada = {
  orden_id?: string | number;
  order_id?: string | number;
  numero_orden?: string | number;
  total?: string | number;
  moneda?: string;
  estado_pago?: string;
  estado_woocommerce?: string;
  metodo_pago?: string;
};

const DATOS_BANCARIOS = {
  titular: "OFERTANDO SpA",
  rut: "77.156.739-8",
  banco: "Banco de Chile",
  tipoCuenta: "Cuenta Vista",
  numeroCuenta: "172422241",
  correo: "chileofertando@gmail.com",
  whatsappVisible: "+56 9 7895 3903",
  whatsappLink: "56978953903",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(price);
}

function getTotalCarrito(carrito: ProductoCarrito[]) {
  return carrito.reduce((acc, item) => {
    const precio = Number(item.precio ?? item.price ?? 0);
    const cantidad = Number(item.cantidad ?? item.quantity ?? 1);
    return acc + precio * cantidad;
  }, 0);
}

function getResumenMontos(carrito: ProductoCarrito[], comprador: Comprador) {
  const subtotalCarrito = getTotalCarrito(carrito);

  const subtotal = Number(comprador.subtotal ?? subtotalCarrito);
  const envio = Number(comprador.envio ?? 0);
  const descuento = Number(comprador.descuento ?? 0);
  const totalDesdeComprador = Number(comprador.total ?? 0);

  const total =
    totalDesdeComprador > 0
      ? totalDesdeComprador
      : Math.max(0, subtotal + envio - descuento);

  return {
    subtotal,
    envio,
    descuento,
    cupon: comprador.cupon || "",
    total,
  };
}

function getNombreProducto(item: ProductoCarrito) {
  return item.nombre || item.name || "Producto";
}

function getCantidadProducto(item: ProductoCarrito) {
  return Number(item.cantidad ?? item.quantity ?? 1);
}

function getPrecioProducto(item: ProductoCarrito) {
  return Number(item.precio ?? item.price ?? 0);
}

function getNombreComprador(comprador: Comprador) {
  const nombreCompleto = comprador.nombre?.trim();

  if (nombreCompleto) {
    return nombreCompleto;
  }

  return `${comprador.nombres || ""} ${comprador.apellido || ""}`.trim();
}

function generarResumenProductos(carrito: ProductoCarrito[]) {
  return carrito
    .map((item) => {
      const nombre = getNombreProducto(item);
      const cantidad = getCantidadProducto(item);
      const precio = getPrecioProducto(item);
      const subtotal = precio * cantidad;

      return `- ${nombre} x ${cantidad} - ${formatPrice(subtotal)}`;
    })
    .join("\n");
}

function generarResumenTotales(params: {
  subtotal: number;
  envio: number;
  descuento: number;
  cupon?: string;
  total: number;
}) {
  const { subtotal, envio, descuento, cupon, total } = params;

  const lineas = [
    `Subtotal productos: ${formatPrice(subtotal)}`,
    `Cargo por envío: ${envio > 0 ? formatPrice(envio) : "Gratis"}`,
  ];

  if (descuento > 0) {
    lineas.push(
      `Descuento${cupon ? ` ${cupon}` : ""}: - ${formatPrice(descuento)}`
    );
  }

  lineas.push(`Total final a transferir: ${formatPrice(total)}`);

  return lineas.join("\n");
}

function generarMensajeWhatsapp(params: {
  numeroOrden: string;
  total: number;
  carrito: ProductoCarrito[];
  comprador: Comprador;
}) {
  const { numeroOrden, total, carrito, comprador } = params;

  const nombreComprador = getNombreComprador(comprador);
  const productos = generarResumenProductos(carrito);

  const resumenMontos = {
    subtotal: Number(comprador.subtotal ?? getTotalCarrito(carrito)),
    envio: Number(comprador.envio ?? 0),
    descuento: Number(comprador.descuento ?? 0),
    cupon: comprador.cupon || "",
    total,
  };

  const totales = generarResumenTotales(resumenMontos);

  return `Hola Ofertando.cl, realicé una compra por transferencia bancaria.

DATOS DEL PEDIDO
Número de pedido: ${numeroOrden}
Monto total a transferir: ${formatPrice(total)}

DETALLE DEL TOTAL
${totales}

DATOS BANCARIOS
Nombre: ${DATOS_BANCARIOS.titular}
RUT: ${DATOS_BANCARIOS.rut}
Banco: ${DATOS_BANCARIOS.banco}
Tipo de cuenta: ${DATOS_BANCARIOS.tipoCuenta}
Número de cuenta: ${DATOS_BANCARIOS.numeroCuenta}
Correo: ${DATOS_BANCARIOS.correo}

PRODUCTOS COMPRADOS
${productos}

DATOS DEL COMPRADOR
Nombre: ${nombreComprador || "No informado"}
RUT: ${comprador.rut || "No informado"}
Correo: ${comprador.email || comprador.correo || "No informado"}
Teléfono: ${comprador.telefono || "No informado"}
Dirección: ${comprador.direccion || "No informada"}
Comuna: ${comprador.ciudad || "No informada"}
Región: ${comprador.region || "No informada"}

Adjunto comprobante de transferencia para validar mi pedido.`;
}

function guardarPedidoTransferencia(params: {
  orden: OrdenCreada;
  carrito: ProductoCarrito[];
  comprador: Comprador;
  total: number;
}) {
  const { orden, carrito, comprador, total } = params;

  const numeroOrden = String(
    orden.numero_orden || orden.orden_id || orden.order_id || ""
  );

  const resumenMontos = getResumenMontos(carrito, comprador);

  const compradorConMontos: Comprador = {
    ...comprador,
    subtotal: resumenMontos.subtotal,
    envio: resumenMontos.envio,
    descuento: resumenMontos.descuento,
    cupon: resumenMontos.cupon,
    total,
  };

  const mensajeWhatsapp = generarMensajeWhatsapp({
    numeroOrden,
    total,
    carrito,
    comprador: compradorConMontos,
  });

  const pedidoGuardado = {
    tipo: "transferencia",
    fecha: new Date().toISOString(),
    numeroOrden,
    orden,
    total,
    totalFormateado: formatPrice(total),
    subtotal: resumenMontos.subtotal,
    subtotalFormateado: formatPrice(resumenMontos.subtotal),
    envio: resumenMontos.envio,
    envioFormateado:
      resumenMontos.envio > 0 ? formatPrice(resumenMontos.envio) : "Gratis",
    descuento: resumenMontos.descuento,
    descuentoFormateado: formatPrice(resumenMontos.descuento),
    cupon: resumenMontos.cupon,
    comprador: compradorConMontos,
    productos: carrito,
    datosBancarios: DATOS_BANCARIOS,
    whatsapp: {
      numero: DATOS_BANCARIOS.whatsappLink,
      numeroVisible: DATOS_BANCARIOS.whatsappVisible,
      mensaje: mensajeWhatsapp,
      url: `https://wa.me/${DATOS_BANCARIOS.whatsappLink}?text=${encodeURIComponent(
        mensajeWhatsapp
      )}`,
    },
  };

  localStorage.setItem(
    "ofertando_ultimo_pedido_transferencia",
    JSON.stringify(pedidoGuardado)
  );

  localStorage.setItem(
    "ofertando_whatsapp_context",
    JSON.stringify({
      tipo: "comprobante_transferencia",
      numero: DATOS_BANCARIOS.whatsappLink,
      mensaje: mensajeWhatsapp,
      url: pedidoGuardado.whatsapp.url,
      numeroOrden,
      total,
      fecha: pedidoGuardado.fecha,
    })
  );

  try {
    const historialRaw = localStorage.getItem("ofertando_pedidos_transferencia");
    const historial = historialRaw ? JSON.parse(historialRaw) : [];

    const nuevoHistorial = Array.isArray(historial)
      ? [pedidoGuardado, ...historial].slice(0, 10)
      : [pedidoGuardado];

    localStorage.setItem(
      "ofertando_pedidos_transferencia",
      JSON.stringify(nuevoHistorial)
    );
  } catch {
    localStorage.setItem(
      "ofertando_pedidos_transferencia",
      JSON.stringify([pedidoGuardado])
    );
  }

  window.dispatchEvent(
    new CustomEvent("ofertando:pedido-transferencia-creado", {
      detail: pedidoGuardado,
    })
  );

  return pedidoGuardado;
}

async function canjearCuponTransferencia(params: {
  orden: OrdenCreada;
  subtotal: number;
  descuento: number;
  cupon: string;
  total: number;
}) {
  const { orden, subtotal, descuento, cupon, total } = params;

  const codigo = String(cupon || "").trim().toUpperCase();

  if (!codigo || subtotal <= 0 || descuento <= 0) {
    return;
  }

  const orderId = String(
    orden.numero_orden ||
      orden.orden_id ||
      orden.order_id ||
      `TRANSFERENCIA-${Date.now()}`
  );

  const storageKey = `ofertando-cupon-transferencia-canjeado-${orderId}-${codigo}`;

  if (sessionStorage.getItem(storageKey) === "1") {
    return;
  }

  try {
    const response = await fetch("/api/cupon-canjear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codigo,
        subtotal,
        orderId,
        descuento,
        total,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.warn(
        "No se pudo registrar el uso del cupón por transferencia:",
        data
      );
      return;
    }

    sessionStorage.setItem(storageKey, "1");

    console.log("Cupón por transferencia canjeado correctamente:", {
      codigo,
      orderId,
      descuento,
      total,
    });
  } catch (error) {
    console.warn("Error canjeando cupón por transferencia:", error);
  }
}

export default function PagoTransferencia({
  carrito,
  comprador,
}: PagoTransferenciaProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [ordenCreada, setOrdenCreada] = useState<OrdenCreada | null>(null);
  const [error, setError] = useState("");
  const [totalConfirmado, setTotalConfirmado] = useState<number | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState("");

  const { clearCart } = useCartStore();

  const pedidoConfirmadoRef = useRef(false);

  const resumenMontos = getResumenMontos(carrito, comprador);

  const subtotal = resumenMontos.subtotal;
  const envio = resumenMontos.envio;
  const descuento = resumenMontos.descuento;
  const cupon = resumenMontos.cupon;
  const total = resumenMontos.total;

  const numeroOrden =
    ordenCreada?.numero_orden || ordenCreada?.orden_id || ordenCreada?.order_id;

  /*
   * Importante:
   * No usamos ordenCreada.total porque WordPress/API puede devolver solo subtotal.
   * Usamos el total final calculado en checkout: subtotal + envío - descuento.
   */
  const totalOrden = totalConfirmado ?? total;

  useEffect(() => {
    function limpiarCarritoSiPedidoConfirmado() {
      if (pedidoConfirmadoRef.current) {
        clearCart();
      }
    }

    window.addEventListener("beforeunload", limpiarCarritoSiPedidoConfirmado);

    return () => {
      window.removeEventListener(
        "beforeunload",
        limpiarCarritoSiPedidoConfirmado
      );

      limpiarCarritoSiPedidoConfirmado();
    };
  }, [clearCart]);

  useEffect(() => {
    if (!ordenCreada) {
      document.body.classList.remove("ofertando-checkout-confirmado");
      return;
    }

    document.body.classList.add("ofertando-checkout-confirmado");

    const styleId = "ofertando-hide-cart-confirmacion-style";

    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        body.ofertando-checkout-confirmado header a[href*="carrito"],
        body.ofertando-checkout-confirmado header a[href*="cart"],
        body.ofertando-checkout-confirmado header button[aria-label*="carrito"],
        body.ofertando-checkout-confirmado header button[aria-label*="Carrito"],
        body.ofertando-checkout-confirmado header button[aria-label*="cart"],
        body.ofertando-checkout-confirmado header button[aria-label*="Cart"],
        body.ofertando-checkout-confirmado header [data-cart],
        body.ofertando-checkout-confirmado header [data-cart-button],
        body.ofertando-checkout-confirmado header .cart-icon,
        body.ofertando-checkout-confirmado header .cart-button,
        body.ofertando-checkout-confirmado header .shopping-cart {
          display: none !important;
        }
      `;

      document.head.appendChild(style);
    }

    return () => {
      document.body.classList.remove("ofertando-checkout-confirmado");
    };
  }, [ordenCreada]);

  async function confirmarTransferencia() {
    try {
      setLoading(true);
      setError("");
      setWhatsappUrl("");

      if (!carrito || carrito.length === 0) {
        throw new Error("Tu carrito está vacío.");
      }

      const totalFinalTransferencia = total;

      const compradorConMontos: Comprador = {
        ...comprador,
        subtotal,
        envio,
        descuento,
        cupon,
        total: totalFinalTransferencia,
      };

      const payload = {
        comprador: compradorConMontos,
        productos: carrito,
        subtotal,
        envio,
        descuento,
        cupon,
        total: totalFinalTransferencia,
        metodo_pago: "transferencia",
        estado_pago: "pendiente",
      };

      const res = await fetch("/api/pago-transferencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data?.message ||
            data?.error?.message ||
            "No se pudo registrar la orden por transferencia."
        );
      }

      const orden: OrdenCreada = data.data || data;

      await canjearCuponTransferencia({
        orden,
        subtotal,
        descuento,
        cupon,
        total: totalFinalTransferencia,
      });

      pedidoConfirmadoRef.current = true;

      setOrdenCreada(orden);
      setTotalConfirmado(totalFinalTransferencia);

      const pedidoGuardado = guardarPedidoTransferencia({
        orden,
        carrito,
        comprador: compradorConMontos,
        total: totalFinalTransferencia,
      });

      setWhatsappUrl(pedidoGuardado.whatsapp.url);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al confirmar pedido por transferencia.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function volverAlCatalogo() {
    clearCart();
    pedidoConfirmadoRef.current = false;
    router.push("/catalogo");
  }

  if (ordenCreada) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white">
            ✓
          </div>

          <h2 className="mt-4 text-2xl font-bold text-green-800">
            Pedido recibido correctamente
          </h2>

          <p className="mt-2 text-sm text-green-900">
            Tu compra quedó registrada en Ofertando.cl y está pendiente de
            confirmación de pago por transferencia bancaria.
          </p>

          {numeroOrden && (
            <p className="mt-3 text-lg font-bold text-green-900">
              Número de pedido: #{numeroOrden}
            </p>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-5">
          <h3 className="text-lg font-bold text-orange-900">
            Total a transferir
          </h3>

          <div className="mt-4 space-y-2 text-sm text-orange-950">
            <div className="flex justify-between gap-4">
              <span>Subtotal productos</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <div className="flex justify-between gap-4">
              <span>Cargo por envío</span>
              <strong>{envio > 0 ? formatPrice(envio) : "Gratis"}</strong>
            </div>

            {descuento > 0 && (
              <div className="flex justify-between gap-4 text-green-700">
                <span>Descuento{cupon ? ` ${cupon}` : ""}</span>
                <strong>- {formatPrice(descuento)}</strong>
              </div>
            )}

            <div className="mt-3 border-t border-orange-200 pt-3">
              <div className="flex justify-between gap-4 text-lg font-bold text-orange-950">
                <span>Total final</span>
                <span>{formatPrice(totalOrden)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border bg-gray-50 p-5">
          <h3 className="text-lg font-bold text-gray-900">
            Datos para transferencia
          </h3>

          <div className="mt-4 grid gap-2 text-sm text-gray-800 sm:grid-cols-2">
            <p>
              <strong>Nombre:</strong> {DATOS_BANCARIOS.titular}
            </p>
            <p>
              <strong>RUT:</strong> {DATOS_BANCARIOS.rut}
            </p>
            <p>
              <strong>Banco:</strong> {DATOS_BANCARIOS.banco}
            </p>
            <p>
              <strong>Tipo de cuenta:</strong> {DATOS_BANCARIOS.tipoCuenta}
            </p>
            <p>
              <strong>Número de cuenta:</strong> {DATOS_BANCARIOS.numeroCuenta}
            </p>
            <p>
              <strong>Correo:</strong> {DATOS_BANCARIOS.correo}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="text-lg font-bold text-blue-950">
            Envía tu comprobante
          </h3>

          <p className="mt-2 text-sm leading-6 text-blue-900">
            También enviamos el detalle del pedido a tu correo. Para comenzar a
            gestionar la compra, realiza la transferencia y envíanos el
            comprobante por WhatsApp indicando tu número de pedido.
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-900">
            El botón abrirá WhatsApp con un mensaje preparado y ordenado. Solo
            debes adjuntar el comprobante y presionar enviar.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-center font-bold text-white transition hover:bg-green-700 sm:w-auto"
              >
                Enviar comprobante por WhatsApp
              </a>
            )}

            <button
              type="button"
              onClick={volverAlCatalogo}
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-bold text-gray-900 transition hover:bg-gray-100 sm:w-auto"
            >
              Volver al catálogo
            </button>
          </div>

          <p className="mt-3 text-xs text-blue-800">
            Al volver al catálogo, el carrito de esta compra se limpiará
            automáticamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Pago por transferencia bancaria</h2>

      <p className="mt-3 text-gray-700">
        Al confirmar, tu pedido quedará registrado como pendiente de pago por
        transferencia bancaria.
      </p>

      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm leading-6 text-blue-900">
          Al confirmar este pedido, registraremos tu orden y dejaremos preparado
          un mensaje de WhatsApp con todos los datos del pedido: número de pedido,
          monto, productos comprados, datos del comprador y datos bancarios.
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-900">
          Importante: WhatsApp no se envía solo. Se abrirá con el mensaje listo y
          tú solo debes presionar <strong>Enviar</strong>.
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-900">
          Si no alcanzas a enviar el WhatsApp en ese momento, tendrás una
          oportunidad más para enviarlo desde el botón verde{" "}
          <strong>“¿Te ayudamos?”</strong>.
        </p>
      </div>

      <div className="mt-5 rounded-xl border bg-gray-50 p-4">
        <h3 className="mb-3 font-semibold">Datos para transferencia</h3>

        <div className="space-y-1 text-sm text-gray-800">
          <p>
            <strong>Nombre:</strong> {DATOS_BANCARIOS.titular}
          </p>
          <p>
            <strong>RUT:</strong> {DATOS_BANCARIOS.rut}
          </p>
          <p>
            <strong>Banco:</strong> {DATOS_BANCARIOS.banco}
          </p>
          <p>
            <strong>Tipo de cuenta:</strong> {DATOS_BANCARIOS.tipoCuenta}
          </p>
          <p>
            <strong>Número de cuenta:</strong> {DATOS_BANCARIOS.numeroCuenta}
          </p>
          <p>
            <strong>Correo:</strong> {DATOS_BANCARIOS.correo}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
        <h3 className="mb-3 font-semibold text-orange-900">
          Resumen a transferir
        </h3>

        <div className="space-y-2 text-sm text-orange-950">
          <div className="flex justify-between gap-4">
            <span>Subtotal productos</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <div className="flex justify-between gap-4">
            <span>Cargo por envío</span>
            <strong>{envio > 0 ? formatPrice(envio) : "Gratis"}</strong>
          </div>

          {descuento > 0 && (
            <div className="flex justify-between gap-4 text-green-700">
              <span>Descuento{cupon ? ` ${cupon}` : ""}</span>
              <strong>- {formatPrice(descuento)}</strong>
            </div>
          )}

          <div className="mt-3 border-t border-orange-200 pt-3">
            <div className="flex justify-between gap-4 text-base font-bold">
              <span>Total a transferir</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={confirmarTransferencia}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 sm:w-auto"
      >
        {loading
          ? "Registrando pedido..."
          : "Confirmar pedido por transferencia"}
      </button>
    </div>
  );
}
