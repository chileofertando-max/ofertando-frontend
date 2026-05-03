import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getWordPressRestUrl() {
  const rawUrl =
    process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WP_REST_URL || "";

  if (!rawUrl) {
    throw new Error("Falta configurar WORDPRESS_API_URL o NEXT_PUBLIC_WP_REST_URL");
  }

  let url = rawUrl.trim().replace(/\/+$/, "");

  if (!url.endsWith("/wp-json")) {
    url = `${url}/wp-json`;
  }

  return url;
}

/**
 * Ruta de diagnóstico.
 * Sirve para abrir en navegador y confirmar que la API está desplegada.
 */
export async function GET() {
  try {
    const wpUrl = getWordPressRestUrl();

    return NextResponse.json({
      ok: true,
      message: "API cupon-canjear activa. Esta ruta real funciona por POST.",
      wordpressRestUrl: wpUrl,
      hasSecret: Boolean(process.env.OFERTANDO_CUPON_SECRET),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Error de configuración.",
        hasSecret: Boolean(process.env.OFERTANDO_CUPON_SECRET),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const codigo = String(body.codigo || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal || 0);
    const orderId = String(body.orderId || "").trim();

    console.log("Canje cupón solicitado:", {
      codigo,
      subtotal,
      orderId,
      descuento: Number(body.descuento || 0),
      total: Number(body.total || 0),
    });

    if (!codigo) {
      return NextResponse.json(
        {
          success: false,
          message: "No se recibió código de cupón.",
        },
        { status: 400 }
      );
    }

    if (!subtotal || subtotal <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Subtotal no válido para canjear cupón.",
        },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "No se recibió número de pedido.",
        },
        { status: 400 }
      );
    }

    const secret = process.env.OFERTANDO_CUPON_SECRET || "";

    if (!secret) {
      console.error("Falta configurar OFERTANDO_CUPON_SECRET en Vercel.");

      return NextResponse.json(
        {
          success: false,
          message: "Falta configurar OFERTANDO_CUPON_SECRET en Vercel.",
        },
        { status: 500 }
      );
    }

    const wpUrl = getWordPressRestUrl();

    const response = await fetch(`${wpUrl}/ofertando/v1/cupon-canjear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ofertando-secret": secret,
      },
      body: JSON.stringify({
        codigo,
        subtotal,
        orderId,
        descuento: Number(body.descuento || 0),
        total: Number(body.total || 0),
      }),
      cache: "no-store",
    });

    const data = await response.json();

    console.log("Respuesta WordPress canje cupón:", {
      status: response.status,
      ok: response.ok,
      data,
    });

    return NextResponse.json(
      {
        ...data,
        debug: {
          wpStatus: response.status,
          wpOk: response.ok,
        },
      },
      {
        status: response.ok ? 200 : response.status,
      }
    );
  } catch (error) {
    console.error("Error canjeando cupón:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo registrar el uso del cupón.",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
