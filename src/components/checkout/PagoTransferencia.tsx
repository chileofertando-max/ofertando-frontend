"use client";

import { useState } from "react";
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
    `Envío: ${envio > 0 ? formatPrice(envio) : "Gratis"}`,
  ];

  if (descuento > 0) {
    lineas.push(
      `Descuento${cupon ? ` ${cupon}` : ""}: -${formatPrice(descuento)}`
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

Número de pedido: ${numeroOrden}
Monto a transferir: ${formatPrice(total)}

Datos bancarios:
${DATOS_BANCARIOS.titular}
RUT: ${DATOS_BANCARIOS.rut}
Banco: ${DATOS_BANCARIOS.banco}
Tipo de cuenta: ${DATOS_BANCARIOS.tipoCuenta}
Número de cuenta: ${DATOS_BANCARIOS.numeroCuenta}
Correo: ${DATOS_BANCARIOS.correo}

Productos comprados:
${productos}

Resumen de pago:
${totales}

Datos del comprador:
Nombre: ${nombreComprador || "No informado"}
RUT: ${comprador.rut || "No informado"}
Correo: ${comprador.email || comprador.correo || "No informado"}
Teléfono: ${comprador.telefono || "No informado"}
Dirección: ${comprador.direccion || "No informada"}
Comuna: ${comprador.ciudad || "No informada"}
Región: ${comprador.region || "No informada"}

Adjunto comprobante de transferencia.`;
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

  const mensajeWhatsapp = generarMensajeWhatsapp({
    numeroOrden,
    total,
    carrito,
    comprador,
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
    comprador,
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

export default function PagoTransferencia({
  carrito,
  comprador,
}: PagoTransferenciaProps) {
  const [loading, setLoading] = useState(false);
  const [ordenCreada, setOrdenCreada] = useState<OrdenCreada | null>(null);
  const [error, setError] = useState("");
  const [totalConfirmado, setTotalConfirmado] = useState<number | null>(null);

  const { clearCart } = useCartStore();

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

  async function confirmarTransferencia() {
    try {
      setLoading(true);
      setError("");

      if (!carrito || carrito.length === 0) {
        throw new Error("Tu carrito está vacío.");
      }

      const totalFinalTransferencia = total;

      const payload = {
        comprador,
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

      setOrdenCreada(orden);
      setTotalConfirmado(totalFinalTransferencia);

      guardarPedidoTransferencia({
        orden,
        carrito,
        comprador,
        total: totalFinalTransferencia,
      });

      setTimeout(() => {
        clearCart();
      }, 5000);
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

  if (ordenCreada) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-green-700">
          Orden registrada correctamente
        </h2>

        <p className="mt-3 text-gray-700">
          Tu compra quedó registrada correctamente y quedó pendiente de pago por
          transferencia.
        </p>

        <div className="mt-5 rounded-lg bg-blue-50 p-4 border border-blue-200">
          <p className="text-sm text-blue-900">
            Hemos dejado preparado el botón verde de WhatsApp con todos los datos
            de tu pedido: número de pedido, monto, productos comprados, datos del
            comprador y datos bancarios.
          </p>

          <p className="mt-2 text-sm text-blue-900">
            WhatsApp no se envía solo. Debes tocar el botón verde{" "}
            <strong>“Enviar comprobante”</strong> y luego presionar{" "}
            <strong>Enviar</strong> dentro de WhatsApp.
          </p>

          <p className="mt-2 text-sm text-blue-900">
            Si envías ese WhatsApp, nosotros podremos comenzar a gestionar y
            preparar tu pedido. Posteriormente, en esa misma conversación, podrás
            adjuntar el comprobante de depósito o transferencia.
          </p>

          <p className="mt-2 text-sm text-blue-900">
            Si no alcanzas a enviarlo en este momento, tendrás una oportunidad
            más desde el botón verde <strong>“¿Te ayudamos?”</strong>.
          </p>
        </div>

        <div className="mt-5 rounded-lg bg-gray-50 p-4 border">
          <h3 className="font-semibold mb-3">Datos para transferencia</h3>

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

        <div className="mt-5 rounded-lg bg-orange-50 p-4 border border-orange-200">
          <p className="text-sm text-orange-800">
            Una vez realizada la transferencia, adjunta el comprobante en la
            conversación de WhatsApp indicando tu número de pedido.
          </p>

          {numeroOrden && (
            <p className="mt-2 font-semibold text-orange-900">
              Número de pedido: {numeroOrden}
            </p>
          )}

          <div className="mt-3 space-y-1 text-sm text-orange-900">
            <p>
              <strong>Subtotal:</strong> {formatPrice(subtotal)}
            </p>

            <p>
              <strong>Envío:</strong>{" "}
              {envio > 0 ? formatPrice(envio) : "Gratis"}
            </p>

            {descuento > 0 && (
              <p>
                <strong>Descuento{cupon ? ` ${cupon}` : ""}:</strong> -
                {formatPrice(descuento)}
              </p>
            )}

            <p className="pt-1 text-base font-semibold">
              Total a transferir: {formatPrice(totalOrden)}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          En unos segundos se limpiará el carrito. El número de pedido quedará
          guardado temporalmente para usarlo desde el botón de WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Pago por transferencia bancaria</h2>

      <p className="mt-3 text-gray-700">
        Al confirmar, tu pedido quedará registrado como pendiente de pago por
        transferencia bancaria.
      </p>

      <div className="mt-5 rounded-lg bg-blue-50 p-4 border border-blue-200">
        <p className="text-sm text-blue-900">
          Al confirmar este pedido, registraremos tu orden y dejaremos preparado
          un mensaje de WhatsApp con todos los datos del pedido: número de
          pedido, monto, productos comprados, datos del comprador y datos
          bancarios.
        </p>

        <p className="mt-2 text-sm text-blue-900">
          Importante: WhatsApp no se envía solo. Se abrirá con el mensaje listo y
          tú solo debes presionar <strong>Enviar</strong>.
        </p>

        <p className="mt-2 text-sm text-blue-900">
          Si envías ese WhatsApp, nosotros podremos comenzar a gestionar y
          preparar tu pedido. Posteriormente, en esa misma conversación, podrás
          adjuntar el comprobante de depósito o transferencia.
        </p>

        <p className="mt-2 text-sm text-blue-900">
          Si no alcanzas a enviar el WhatsApp en ese momento, tendrás una
          oportunidad más para enviarlo desde el botón verde{" "}
          <strong>“¿Te ayudamos?”</strong>.
        </p>
      </div>

      <div className="mt-5 rounded-lg bg-gray-50 p-4 border">
        <h3 className="font-semibold mb-3">Datos para transferencia</h3>

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

      <div className="mt-5 rounded-lg bg-orange-50 p-4 border border-orange-200">
        <h3 className="font-semibold mb-3 text-orange-900">
          Resumen a transferir
        </h3>

        <div className="space-y-1 text-sm text-orange-900">
          <p>
            <strong>Subtotal:</strong> {formatPrice(subtotal)}
          </p>

          <p>
            <strong>Envío:</strong> {envio > 0 ? formatPrice(envio) : "Gratis"}
          </p>

          {descuento > 0 && (
            <p>
              <strong>Descuento{cupon ? ` ${cupon}` : ""}:</strong> -
              {formatPrice(descuento)}
            </p>
          )}

          <p className="pt-1 text-base font-semibold">
            Total a transferir: {formatPrice(total)}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <button
        onClick={confirmarTransferencia}
        disabled={loading}
        className="mt-5 rounded-lg bg-black px-5 py-3 text-white font-semibold disabled:opacity-50"
      >
        {loading
          ? "Registrando pedido..."
          : "Confirmar pedido por transferencia"}
      </button>
    </div>
  );
}
