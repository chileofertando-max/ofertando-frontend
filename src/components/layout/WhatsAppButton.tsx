"use client";

import { useEffect, useState } from "react";

const WHATSAPP_NUMBER = "56978953903";
const STORAGE_ACTIVO = "ofertando_whatsapp_context";
const STORAGE_SEGUNDA_OPORTUNIDAD =
  "ofertando_whatsapp_segunda_oportunidad";

type WhatsAppContext = {
  tipo?: string;
  numero?: string;
  mensaje?: string;
  url?: string;
  numeroOrden?: string;
  total?: number;
  fecha?: string;
  modo?: "activo" | "segunda_oportunidad";
};

function crearWhatsappUrl(numero: string, mensaje: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

function getMensajeNormal() {
  return "Hola, tengo una consulta sobre un producto";
}

export function WhatsAppButton() {
  const [whatsappContext, setWhatsappContext] =
    useState<WhatsAppContext | null>(null);

  useEffect(() => {
    function cargarContextoWhatsapp() {
      try {
        const rawActivo = localStorage.getItem(STORAGE_ACTIVO);

        if (rawActivo) {
          const data = JSON.parse(rawActivo);

          if (
            data?.tipo === "comprobante_transferencia" &&
            (data?.mensaje || data?.url)
          ) {
            setWhatsappContext({
              ...data,
              modo: "activo",
            });
            return;
          }
        }

        const rawSegunda = localStorage.getItem(STORAGE_SEGUNDA_OPORTUNIDAD);

        if (rawSegunda) {
          const data = JSON.parse(rawSegunda);

          if (
            data?.tipo === "comprobante_transferencia" &&
            (data?.mensaje || data?.url)
          ) {
            setWhatsappContext({
              ...data,
              modo: "segunda_oportunidad",
            });
            return;
          }
        }

        setWhatsappContext(null);
      } catch {
        setWhatsappContext(null);
      }
    }

    cargarContextoWhatsapp();

    window.addEventListener(
      "ofertando:pedido-transferencia-creado",
      cargarContextoWhatsapp,
    );

    window.addEventListener("storage", cargarContextoWhatsapp);

    return () => {
      window.removeEventListener(
        "ofertando:pedido-transferencia-creado",
        cargarContextoWhatsapp,
      );

      window.removeEventListener("storage", cargarContextoWhatsapp);
    };
  }, []);

  const tienePedidoTransferencia =
    whatsappContext?.tipo === "comprobante_transferencia";

  const esPrimerEnvio =
    tienePedidoTransferencia && whatsappContext?.modo === "activo";

  const esSegundaOportunidad =
    tienePedidoTransferencia &&
    whatsappContext?.modo === "segunda_oportunidad";

  const message = whatsappContext?.mensaje || getMensajeNormal();

  const whatsappUrl =
    whatsappContext?.url ||
    crearWhatsappUrl(whatsappContext?.numero || WHATSAPP_NUMBER, message);

  const buttonText = esPrimerEnvio ? "Enviar comprobante" : "¿Te ayudamos?";

  const ariaLabel = esPrimerEnvio
    ? "Enviar comprobante por WhatsApp"
    : "Contactar por WhatsApp";

  const handleClick = () => {
    if (esPrimerEnvio && whatsappContext) {
      /*
        Primer intento:
        Se abre WhatsApp con todos los datos.
        Luego el botón vuelve visualmente a “¿Te ayudamos?”,
        pero conserva una segunda oportunidad con el mismo mensaje.
      */
      setTimeout(() => {
        localStorage.removeItem(STORAGE_ACTIVO);

        localStorage.setItem(
          STORAGE_SEGUNDA_OPORTUNIDAD,
          JSON.stringify({
            ...whatsappContext,
            modo: "segunda_oportunidad",
          }),
        );

        setWhatsappContext({
          ...whatsappContext,
          modo: "segunda_oportunidad",
        });
      }, 1000);

      return;
    }

    if (esSegundaOportunidad) {
      /*
        Segunda oportunidad:
        Se abre WhatsApp otra vez con los datos del pedido.
        Luego se elimina el contexto y el botón vuelve al mensaje normal.
      */
      setTimeout(() => {
        localStorage.removeItem(STORAGE_SEGUNDA_OPORTUNIDAD);
        setWhatsappContext(null);
      }, 1000);
    }
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      title={
        esPrimerEnvio
          ? `Enviar comprobante del pedido ${
              whatsappContext?.numeroOrden || ""
            }`
          : esSegundaOportunidad
            ? `Tienes una oportunidad más para enviar los datos del pedido ${
                whatsappContext?.numeroOrden || ""
              }`
            : "Contactar por WhatsApp"
      }
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[var(--success)] px-4 py-3 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[var(--success)]/90 active:scale-95 group"
      style={{ boxShadow: "0 4px 20px rgba(5, 150, 105, 0.3)" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 transition-transform group-hover:scale-110"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>

      <span className="hidden text-sm font-medium sm:block">
        {buttonText}
      </span>
    </a>
  );
}
