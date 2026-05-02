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
    const { login, key, password } = await req.json();

    if (!login || !key || !password) {
      return NextResponse.json(
        { message: "Faltan datos para restablecer la contraseña." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 8 caracteres." },
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

    const response = await fetch(`${wpRestUrl}/ofertando/v1/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login, key, password }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data?.message ||
            "No se pudo restablecer la contraseña. El enlace puede estar vencido.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: "Contraseña actualizada correctamente.",
    });
  } catch {
    return NextResponse.json(
      { message: "Error interno al restablecer la contraseña." },
      { status: 500 }
    );
  }
}
