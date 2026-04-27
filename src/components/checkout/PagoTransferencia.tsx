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

function generarMensajeWhatsapp(params: {
  numeroOrden: string;
  total: number;
  carrito: ProductoCarrito[];
  comprador: Comprador;
}) {
  const { numeroOrden, total, carrito, comprador } = params;

  const nombreComprador = getNombreComprador(comprador);
  const productos = generarResumenProductos(carrito);

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

Datos del comprador:
Nombre: ${nombreComprador || "No informado"}
RUT: ${comprador.rut || "No informado"}
Correo: ${comprador.email || comprador.correo || "No informado"}
Teléfono: ${comprador.telefono || "No informado"}
Dirección: ${comprador.direccion || "No informada"}
Ciudad: ${comprador.ciudad || "No informada"}
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
    orden.numero_orden || orden.orden_id || orden.order_id || "",
  );

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
    comprador,
    productos: carrito,
    datosBancarios: DATOS_BANCARIOS,
    whatsapp: {
      numero: DATOS_BANCARIOS.whatsappLink,
      numeroVisible: DATOS_BANCARIOS.whatsappVisible,
      mensaje: mensajeWhatsapp,
      url: `https://wa.me/${DATOS_BANCARIOS.whatsappLink}?text=${encodeURIComponent(
        mensajeWhatsapp,
      )}`,
    },
  };

  localStorage.setItem(
    "ofertando_ultimo_pedido_transferencia",
    JSON.stringify(pedidoGuardado),
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
    }),
  );

  const historialRaw = localStorage.getItem("ofertando_pedidos_transferencia");
  const historial = historialRaw ? JSON.parse(historialRaw) : [];

  const nuevoHistorial = Array.isArray(historial)
    ? [pedidoGuardado, ...historial].slice(0, 10)
    : [pedidoGuardado];

  localStorage.setItem(
    "ofertando_pedidos_transferencia",
    JSON.stringify(nuevoHistorial),
  );

  window.dispatchEvent(
    new CustomEvent("ofertando:pedido-transferencia-creado", {
      detail: pedidoGuardado,
    }),
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

  const { clearCart } = useCartStore();

  const total = getTotalCarrito(carrito);

  const numeroOrden =
    ordenCreada?.numero_orden || ordenCreada?.orden_id || ordenCreada?.order_id;

  const totalOrden = Number(ordenCreada?.total || total || comprador.total || 0);

  async function confirmarTransferencia() {
    try {
      setLoading(true);
      setError("");

      if (!carrito || carrito.length === 0) {
        throw new Error("Tu carrito está vacío.");
      }

      const payload = {
        comprador,
        productos: carrito,
        total,
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
            "No se pudo registrar la orden por transferencia.",
        );
      }

      const orden: OrdenCreada = data.data || data;

      setOrdenCreada(orden);

      guardarPedidoTransferencia({
        orden,
        carrito,
        comprador,
        total: Number(orden.total || total),
      });

      setTimeout(() => {
        clearCart();
      }, 5000);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al confirmar pago por transferencia.";

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

        <p className="mt-2 text-gray-700">
          Si no puedes realizar la transferencia en este momento, no te
          preocupes. Cuando la hagas, usa el botón verde{" "}
          <strong>“¿Te ayudamos?”</strong> para enviarnos el comprobante por
          WhatsApp indicando tu número de pedido.
        </p>

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
            <strong>Número de cuenta:</strong>{" "}
            {DATOS_BANCARIOS.numeroCuenta}
          </p>
          <p>
            <strong>Correo:</strong> {DATOS_BANCARIOS.correo}
          </p>
        </div>

        <div className="mt-5 rounded-lg bg-orange-50 p-4 border border-orange-200">
          <p className="text-sm text-orange-800">
            Una vez realizada la transferencia, envía el comprobante por
            WhatsApp indicando tu número de pedido. Si no puedes transferir
            ahora, puedes hacerlo más tarde y usar el botón{" "}
            <strong>“¿Te ayudamos?”</strong> para avisarnos.
          </p>

          {numeroOrden && (
            <p className="mt-2 font-semibold text-orange-900">
              Número de pedido: {numeroOrden}
            </p>
          )}

          <p className="mt-2 font-semibold text-orange-900">
            Total a transferir: {formatPrice(totalOrden)}
          </p>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          En unos segundos se limpiará el carrito. El número de pedido quedará
          guardado para usarlo desde el botón de WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Pago por transferencia bancaria</h2>

      <p className="mt-3 text-gray-700">
        Al confirmar, tu pedido quedará registrado como pendiente de pago. Luego
        deberás realizar la transferencia bancaria.
      </p>

      <p className="mt-2 text-gray-700">
        Si no puedes transferir en este momento, puedes hacerlo más tarde.
        Cuando tengas el comprobante, usa el botón verde{" "}
        <strong>“¿Te ayudamos?”</strong> para enviarlo por WhatsApp indicando el
        número de pedido.
      </p>

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
          ? "Registrando orden..."
          : "Confirmar pago por transferencia"}
      </button>
    </div>
  );
}
