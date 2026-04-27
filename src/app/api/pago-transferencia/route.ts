import { NextResponse } from "next/server";

function getWordPressRestUrl() {
  const rawUrl = process.env.WORDPRESS_API_URL || "";

  if (!rawUrl) {
    throw new Error("Falta configurar WORDPRESS_API_URL");
  }

  let url = rawUrl.trim().replace(/\/+$/, "");

  if (!url.endsWith("/wp-json")) {
    url = `${url}/wp-json`;
  }

  return url;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const wpUrl = getWordPressRestUrl();

    const response = await fetch(`${wpUrl}/ofertando/v1/pago-transferencia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Error al registrar pago por transferencia",
          error: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Error interno en pago por transferencia",
      },
      { status: 500 }
    );
  }
}
