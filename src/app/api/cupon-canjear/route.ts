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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const codigo = String(body.codigo || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal || 0);
    const orderId = String(body.orderId || "").trim();

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

    return NextResponse.json(data, {
      status: response.ok ? 200 : response.status,
    });
  } catch (error) {
    console.error("Error canjeando cupón:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo registrar el uso del cupón.",
      },
      { status: 500 }
    );
  }
}
