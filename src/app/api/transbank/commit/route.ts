import { NextRequest, NextResponse } from "next/server";
import { webpay } from "@/lib/transbank";
import { cookies } from "next/headers";

type RetornoTransbank = {
  tokenWs?: string | null;
  tbkToken?: string | null;
  tbkOrdenCompra?: string | null;
  tbkIdSesion?: string | null;
};

async function handleCommit(req: NextRequest, data: RetornoTransbank) {
  const token = data.tokenWs || "";

  // Caso sin token_ws: puede ser transacción abortada, anulada o timeout.
  // En este caso NO enviamos "rechazado", "FAILED" ni "token_validacion".
  if (!token) {
    const failUrl = new URL("/checkout/rechazado", req.url);

    failUrl.searchParams.set("motivo", "sin_token_ws");

    if (data.tbkToken) {
      failUrl.searchParams.set("tbk_token", data.tbkToken);
    }

    if (data.tbkOrdenCompra) {
      failUrl.searchParams.set("tbk_orden_compra", data.tbkOrdenCompra);
    }

    if (data.tbkIdSesion) {
      failUrl.searchParams.set("tbk_id_sesion", data.tbkIdSesion);
    }

    return NextResponse.redirect(failUrl);
  }

  // Guardamos el token real de Transbank antes del commit
  const tokenOriginal = token;

  try {
    const response = await webpay.commit(tokenOriginal);

    const status = response.status || "";
    const responseCode = Number(response.response_code);
    const buyOrder = response.buy_order || "";
    const amount = String(response.amount ?? "");

    // Pago aprobado
    if (status === "AUTHORIZED" && responseCode === 0) {
      const pendingOrderStr = cookies().get("pending_order")?.value;

      if (pendingOrderStr) {
        try {
          const pendingOrder = JSON.parse(pendingOrderStr);

          const customerId = pendingOrder.customerId
            ? parseInt(pendingOrder.customerId, 10)
            : 0;

          const billing = pendingOrder.formData
            ? {
                first_name: pendingOrder.formData.nombre,
                last_name: pendingOrder.formData.apellido,
                address_1: pendingOrder.formData.direccion,
                address_2: pendingOrder.formData.direccion2 || "",
                city: pendingOrder.formData.ciudad,
                state: pendingOrder.formData.region,
                postcode: "",
                country: "CL",
                email: pendingOrder.formData.email,
                phone: pendingOrder.formData.telefono || "",
              }
            : {};

          const shipping = pendingOrder.formData
            ? {
                first_name: pendingOrder.formData.nombre,
                last_name: pendingOrder.formData.apellido,
                address_1: pendingOrder.formData.direccion,
                address_2: pendingOrder.formData.direccion2 || "",
                city: pendingOrder.formData.ciudad,
                state: pendingOrder.formData.region,
                postcode: "",
                country: "CL",
              }
            : {};

          const lineItems = pendingOrder.lineItems || [];

          const restPayload = {
            status: "processing",
            customer_id: customerId,
            billing,
            shipping,
            line_items: lineItems,
            payment_method: "webpay_plus",
            payment_method_title: "Webpay Plus",
            transaction_id: tokenOriginal,
            meta_data: [
              {
                key: "transbank_token_ws",
                value: tokenOriginal,
              },
              {
                key: "transbank_status",
                value: status,
              },
              {
                key: "transbank_response_code",
                value: String(responseCode),
              },
              {
                key: "transbank_buy_order",
                value: buyOrder,
              },
            ],
          };

          console.log("PAYLOAD REST WOOCOMMERCE:", restPayload);

          const authHeader =
            "Basic " +
            Buffer.from(
              `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`,
            ).toString("base64");

          const wcResponse = await fetch(
            `${process.env.NEXT_PUBLIC_WP_REST_URL}/wc/v3/orders`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
              },
              body: JSON.stringify(restPayload),
            },
          );

          if (!wcResponse.ok) {
            const errorData = await wcResponse.json();
            console.error(
              "WooCommerce order creation failed:",
              wcResponse.status,
              errorData,
            );
          } else {
            const orderData = await wcResponse.json();
            console.log(
              "Orden creada en WooCommerce:",
              orderData.id,
              orderData.number,
            );
          }
        } catch (orderError) {
          console.error("Error creating order in WooCommerce:", orderError);
        }
      }

      cookies().delete("pending_order");

      const successUrl = new URL("/checkout/exito", req.url);
      successUrl.searchParams.set("token_ws", tokenOriginal);
      successUrl.searchParams.set("status", status);
      successUrl.searchParams.set("response_code", String(responseCode));
      successUrl.searchParams.set("buyOrder", buyOrder);
      successUrl.searchParams.set("amount", amount);

      return NextResponse.redirect(successUrl);
    }

    // Pago rechazado, pero conservando el token real una sola vez
    const failUrl = new URL("/checkout/rechazado", req.url);
    failUrl.searchParams.set("token_ws", tokenOriginal);
    failUrl.searchParams.set("status", status || "FAILED");
    failUrl.searchParams.set("response_code", String(responseCode));
    failUrl.searchParams.set("buyOrder", buyOrder);
    failUrl.searchParams.set("amount", amount);

    return NextResponse.redirect(failUrl);
  } catch (error) {
    console.error("Transbank commit error:", error);

    const failUrl = new URL("/checkout/rechazado", req.url);
    failUrl.searchParams.set("token_ws", tokenOriginal);
    failUrl.searchParams.set("motivo", "error_commit");

    return NextResponse.redirect(failUrl);
  }
}

export async function GET(req: NextRequest) {
  const data: RetornoTransbank = {
    tokenWs: req.nextUrl.searchParams.get("token_ws"),
    tbkToken: req.nextUrl.searchParams.get("TBK_TOKEN"),
    tbkOrdenCompra: req.nextUrl.searchParams.get("TBK_ORDEN_COMPRA"),
    tbkIdSesion: req.nextUrl.searchParams.get("TBK_ID_SESION"),
  };

  return handleCommit(req, data);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const data: RetornoTransbank = {
    tokenWs: formData.get("token_ws")?.toString() || null,
    tbkToken: formData.get("TBK_TOKEN")?.toString() || null,
    tbkOrdenCompra: formData.get("TBK_ORDEN_COMPRA")?.toString() || null,
    tbkIdSesion: formData.get("TBK_ID_SESION")?.toString() || null,
  };

  return handleCommit(req, data);
}
