import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getWordPressRestUrl() {
  const rawUrl =
    process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WP_REST_URL || "";

  if (!rawUrl) {
    throw new Error(
      "Falta configurar WORDPRESS_API_URL o NEXT_PUBLIC_WP_REST_URL"
    );
  }

  let url = rawUrl.trim().replace(/\/+$/, "");

  if (!url.endsWith("/wp-json")) {
    url = `${url}/wp-json`;
  }

  return url;
}

function getWooAuthHeader() {
  const key = process.env.WC_CONSUMER_KEY || "";
  const secret = process.env.WC_CONSUMER_SECRET || "";

  if (!key || !secret) {
    throw new Error("Faltan WC_CONSUMER_KEY o WC_CONSUMER_SECRET");
  }

  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

function normalizarTexto(valor: unknown) {
  if (valor === undefined || valor === null) return "";
  return String(valor).trim();
}

function normalizarEmail(email: string) {
  return String(email || "").toLowerCase().trim();
}

async function buscarCustomerPorEmail(
  wpUrl: string,
  authHeader: string,
  email: string
) {
  const res = await fetch(
    `${wpUrl}/wc/v3/customers?email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: authHeader,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return null;
  }

  const customers = await res.json();

  if (Array.isArray(customers) && customers.length > 0) {
    return customers[0];
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();

    const nombre = normalizarTexto(body.nombre || body.firstName);
    const apellido = normalizarTexto(body.apellido || body.lastName);
    const telefono = normalizarTexto(body.telefono);
    const rut = normalizarTexto(body.rut);
    const direccion = normalizarTexto(body.direccion);
    const direccion2 = normalizarTexto(body.direccion2);
    const ciudad = normalizarTexto(body.ciudad);
    const region = normalizarTexto(body.region);

    if (!nombre || !apellido || !direccion || !ciudad || !region) {
      return NextResponse.json(
        {
          error:
            "Faltan datos obligatorios: nombre, apellido, dirección, ciudad o región.",
        },
        { status: 400 }
      );
    }

    const emailUsuario = normalizarEmail(session.user.email);
    const wpUrl = getWordPressRestUrl();
    const authHeader = getWooAuthHeader();

    const customer = await buscarCustomerPorEmail(
      wpUrl,
      authHeader,
      emailUsuario
    );

    if (!customer?.id) {
      return NextResponse.json(
        {
          error:
            "No se encontró el cliente en WooCommerce para el correo del usuario.",
        },
        { status: 404 }
      );
    }

    const payload = {
      first_name: nombre,
      last_name: apellido,
      billing: {
        first_name: nombre,
        last_name: apellido,
        email: emailUsuario,
        phone: telefono,
        address_1: direccion,
        address_2: direccion2,
        city: ciudad,
        state: region,
        postcode: "",
        country: "CL",
      },
      shipping: {
        first_name: nombre,
        last_name: apellido,
        address_1: direccion,
        address_2: direccion2,
        city: ciudad,
        state: region,
        postcode: "",
        country: "CL",
      },
      meta_data: [
        {
          key: "rut",
          value: rut,
        },
        {
          key: "_rut",
          value: rut,
        },
        {
          key: "billing_rut",
          value: rut,
        },
        {
          key: "_billing_rut",
          value: rut,
        },
        {
          key: "_ofertando_rut_comprador",
          value: rut,
        },
      ],
    };

    const updateRes = await fetch(`${wpUrl}/wc/v3/customers/${customer.id}`, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      return NextResponse.json(
        {
          error:
            updateData?.message ||
            "No se pudo actualizar el perfil del cliente.",
          details: updateData,
        },
        { status: updateRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Perfil actualizado correctamente.",
      customer_id: customer.id,
      customer: updateData,
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);

    return NextResponse.json(
      {
        error: error?.message || "Error interno al actualizar perfil.",
      },
      { status: 500 }
    );
  }
}
