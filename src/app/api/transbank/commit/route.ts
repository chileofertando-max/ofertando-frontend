import { NextRequest, NextResponse } from "next/server";
import { webpay } from "@/lib/transbank";
import { cookies } from "next/headers";

async function handleCommit(token: string, req: NextRequest) {
  if (!token) {
    return NextResponse.redirect(new URL("/checkout/rechazado", req.url));
  }

  try {
    const response = await webpay.commit(token);

    if (response.status === "AUTHORIZED") {
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
      successUrl.searchParams.set("token", token);
      successUrl.searchParams.set("buyOrder", response.buy_order);
      successUrl.searchParams.set("amount", String(response.amount));
      return NextResponse.redirect(successUrl);
    }

    const failUrl = new URL("/checkout/rechazado", req.url);
    failUrl.searchParams.set("status", response.status);
    return NextResponse.redirect(failUrl);
  } catch (error) {
    console.error("Transbank commit error:", error);
    const failUrl = new URL("/checkout/rechazado", req.url);
    return NextResponse.redirect(failUrl);
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token_ws");
  return handleCommit(token || "", req);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const token = formData.get("token_ws") as string | null;
  return handleCommit(token || "", req);
}
