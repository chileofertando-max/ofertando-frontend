import { NextResponse } from "next/server";

function getWordPressRestUrl() {
  const rawUrl =
    process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WP_REST_URL || "";

  if (!rawUrl) return "";

  let url = rawUrl.trim().replace(/\/+$/, "");

  if (!url.endsWith("/wp-json")) {
    url = `${url}/wp-json`;
  }

  return url;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Debes ingresar un correo válido." },
        { status: 400 }
      );
    }

    const wpRestUrl = getWordPressRestUrl();

    if (!wpRestUrl) {
      return NextResponse.json(
        { message: "No está configurada la URL de WordPress." },
        { status: 500 }
      );
    }

    const response = await fetch(`${wpRestUrl}/ofertando/v1/lost-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data?.message ||
            "No se pudo solicitar la recuperación de contraseña.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message:
        "Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.",
    });
  } catch {
    return NextResponse.json(
      { message: "Error interno al solicitar recuperación de contraseña." },
      { status: 500 }
    );
  }
}
