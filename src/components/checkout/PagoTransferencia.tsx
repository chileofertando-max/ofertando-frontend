"use client";

import { useState } from "react";

export default function PagoTransferencia({
  carrito,
  comprador,
}: {
  carrito: any[];
  comprador: any;
}) {
  const [loading, setLoading] = useState(false);
  const [ordenCreada, setOrdenCreada] = useState<any>(null);
  const [error, setError] = useState("");

  async function confirmarTransferencia() {
    try {
      setLoading(true);
      setError("");

      const total = carrito.reduce((acc, item) => {
        return acc + Number(item.precio || 0) * Number(item.cantidad || 1);
      }, 0);

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
        throw new Error(data.message || "No se pudo registrar la orden");
      }

      setOrdenCreada(data.data);
    } catch (err: any) {
      setError(err.message || "Error al confirmar transferencia");
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
          Tu compra quedó registrada como pendiente de pago por transferencia.
        </p>

        <div className="mt-5 rounded-lg bg-gray-50 p-4 border">
          <h3 className="font-semibold mb-2">Datos para transferencia</h3>

          <p><strong>Banco:</strong> Banco a definir</p>
          <p><strong>Tipo de cuenta:</strong> Cuenta corriente</p>
          <p><strong>Número de cuenta:</strong> 000000000</p>
          <p><strong>Nombre:</strong> Ofertando.cl</p>
          <p><strong>RUT:</strong> 00.000.000-0</p>
          <p><strong>Correo:</strong> pagos@ofertando.cl</p>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Una vez realizada la transferencia, envía el comprobante indicando el número de orden.
        </p>

        {ordenCreada?.orden_id && (
          <p className="mt-2 font-semibold">
            Número de orden: {ordenCreada.orden_id}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Pago por transferencia bancaria</h2>

      <p className="mt-3 text-gray-700">
        Al confirmar, tu pedido quedará registrado como pendiente de pago.
        Luego deberás realizar la transferencia bancaria.
      </p>

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
        {loading ? "Registrando orden..." : "Confirmar pago por transferencia"}
      </button>
    </div>
  );
}