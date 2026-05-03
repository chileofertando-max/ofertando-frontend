import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

function getWooAuthHeader() {
  const key = process.env.WC_CONSUMER_KEY || "";
  const secret = process.env.WC_CONSUMER_SECRET || "";

  if (!key || !secret) {
    throw new Error("Faltan WC_CONSUMER_KEY o WC_CONSUMER_SECRET");
  }

  return (
    "Basic " +
    Buffer.from(`${key}:${secret}`).toString("base64")
  );
}

function normalizarEmail(email: string) {
  return String(email || "").toLowerCase().trim();
}

function getMetaValue(metaData: any[] | undefined, keys: string[]) {
  if (!Array.isArray(metaData)) return "";

  for (const key of keys) {
    const item = metaData.find((meta: any) => meta?.key === key);

    if (item?.value !== undefined && item?.value !== null && item?.value !== "") {
      return String(item.value);
    }
  }

  return "";
}

function elegirValor(...valores: any[]) {
  for (const valor of valores) {
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return String(valor).trim();
    }
  }

  return "";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const emailUsuario = normalizarEmail(session.user.email);
    const wpUrl = getWordPressRestUrl();
    const authHeader = getWooAuthHeader();

    let customer: any = null;

    const customerRes = await fetch(
      `${wpUrl}/wc/v3/customers?email=${encodeURIComponent(emailUsuario)}`,
      {
        headers: {
          Authorization: authHeader,
        },
        cache: "no-store",
      }
    );

    if (customerRes.ok) {
      const customers = await customerRes.json();

      if (Array.isArray(customers) && customers.length > 0) {
        customer = customers[0];
      }
    }

    let pedidosCliente: any[] = [];

    const ordersRes = await fetch(
      `${wpUrl}/wc/v3/orders?per_page=100&orderby=date&order=desc&status=any`,
      {
        headers: {
          Authorization: authHeader,
        },
        cache: "no-store",
      }
    );

    if (ordersRes.ok) {
      const orders = await ordersRes.json();

      if (Array.isArray(orders)) {
        pedidosCliente = orders.filter((order: any) => {
          const billingEmail = normalizarEmail(order?.billing?.email || "");
          const orderCustomerId = Number(order?.customer_id || 0);
          const customerId = Number(customer?.id || 0);

          return (
            billingEmail === emailUsuario ||
            (customerId > 0 && orderCustomerId === customerId)
          );
        });
      }
    }

    const ultimoPedido = pedidosCliente.length > 0 ? pedidosCliente[0] : null;

    const customerBilling = customer?.billing || {};
    const customerShipping = customer?.shipping || {};
    const orderBilling = ultimoPedido?.billing || {};
    const orderShipping = ultimoPedido?.shipping || {};

    const rut =
      getMetaValue(customer?.meta_data, [
        "rut",
        "_rut",
        "billing_rut",
        "_billing_rut",
        "_ofertando_rut_comprador",
      ]) ||
      getMetaValue(ultimoPedido?.meta_data, [
        "_ofertando_rut_comprador",
        "rut",
        "_rut",
        "billing_rut",
        "_billing_rut",
      ]);

    const shippingData = {
      firstName: elegirValor(
        customer?.first_name,
        customerBilling?.first_name,
        orderBilling?.first_name,
        session.user.name?.split(" ")?.[0]
      ),

      lastName: elegirValor(
        customer?.last_name,
        customerBilling?.last_name,
        orderBilling?.last_name,
        session.user.name?.split(" ")?.slice(1).join(" ")
      ),

      email: elegirValor(
        customer?.email,
        orderBilling?.email,
        session.user.email
      ),

      telefono: elegirValor(
        customerBilling?.phone,
        orderBilling?.phone
      ),

      rut,

      direccion: elegirValor(
        customerBilling?.address_1,
        customerShipping?.address_1,
        orderBilling?.address_1,
        orderShipping?.address_1
      ),

      direccion2: elegirValor(
        customerBilling?.address_2,
        customerShipping?.address_2,
        orderBilling?.address_2,
        orderShipping?.address_2
      ),

      ciudad: elegirValor(
        customerBilling?.city,
        customerShipping?.city,
        orderBilling?.city,
        orderShipping?.city
      ),

      region: elegirValor(
        customerBilling?.state,
        customerShipping?.state,
        orderBilling?.state,
        orderShipping?.state
      ),

      codigoPostal: elegirValor(
        customerBilling?.postcode,
        customerShipping?.postcode,
        orderBilling?.postcode,
        orderShipping?.postcode
      ),

      pais: elegirValor(
        customerBilling?.country,
        customerShipping?.country,
        orderBilling?.country,
        orderShipping?.country,
        "CL"
      ),
    };

    return NextResponse.json({
      success: true,
      shippingData,
      source: {
        customer_id: customer?.id || null,
        ultimo_pedido_id: ultimoPedido?.id || null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching shipping data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Error al obtener datos",
      },
      { status: 500 }
    );
  }
}
