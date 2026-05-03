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

    if (!codigo) {
      return NextResponse.json(
        { valid: false, message: "Debes ingresar un código de cupón." },
        { status: 400 }
      );
    }

    if (!subtotal || subtotal <= 0) {
      return NextResponse.json(
        { valid: false, message: "El subtotal no es válido." },
        { status: 400 }
      );
    }

    const wpUrl = getWordPressRestUrl();

    const response = await fetch(`${wpUrl}/ofertando/v1/cupon-validar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codigo,
        subtotal,
      }),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.ok ? 200 : response.status,
    });
  } catch (error) {
    console.error("Error validando cupón:", error);

    return NextResponse.json(
      {
        valid: false,
        message: "No se pudo validar el cupón. Intenta nuevamente.",
      },
      { status: 500 }
    );
  }
}
