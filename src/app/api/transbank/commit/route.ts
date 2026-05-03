import { NextRequest, NextResponse } from "next/server";
import { webpay } from "@/lib/transbank";
import { cookies } from "next/headers";

type RetornoTransbank = {
  tokenWs?: string | null;
  tbkToken?: string | null;
  tbkOrdenCompra?: string | null;
  tbkIdSesion?: string | null;
};

type PendingOrder = {
  customerId?: number | string;
  formData?: {
    nombre?: string;
    apellido?: string;
    direccion?: string;
    direccion2?: string;
    ciudad?: string;
    region?: string;
    email?: string;
    telefono?: string;
  };
  lineItems?: Array<{
    product_id: number;
    quantity: number;
  }>;
  coupon?: {
    code?: string;
    type?: string;
    value?: number;
    discount?: number;
  } | null;
  totals?: {
    subtotal?: number;
    shipping?: number | null;
    discount?: number;
    finalAmount?: number;
  } | null;
  shipping?: {
    region?: string;
    comuna?: string;
    cost?: number;
    label?: string;
  } | null;
  amount?: number;
  orderId?: string;
};

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

async function redeemCouponIfNeeded(
  pendingOrder: PendingOrder,
  wooOrderId?: number | string
) {
  const couponCode = String(pendingOrder.coupon?.code || "")
    .trim()
    .toUpperCase();

  const subtotal = Number(pendingOrder.totals?.subtotal || 0);
  const descuento = Number(
    pendingOrder.coupon?.discount || pendingOrder.totals?.discount || 0
  );
  const total = Number(
    pendingOrder.totals?.finalAmount || pendingOrder.amount || 0
  );

  const orderId = String(
    wooOrderId || pendingOrder.orderId || `WEBPAY-${Date.now()}`
  );

  if (!couponCode || subtotal <= 0 || descuento <= 0) {
    return;
  }

  const secret = process.env.OFERTANDO_CUPON_SECRET || "";

  if (!secret) {
    console.error("Falta configurar OFERTANDO_CUPON_SECRET en Vercel.");
    return;
  }

  try {
    const wpUrl = getWordPressRestUrl();

    const response = await fetch(`${wpUrl}/ofertando/v1/cupon-canjear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ofertando-secret": secret,
      },
      body: JSON.stringify({
        codigo: couponCode,
        subtotal,
        orderId,
        descuento,
        total,
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("No se pudo canjear el cupón en WordPress:", {
        status: response.status,
        data,
      });
      return;
    }

    console.log("Cupón canjeado correctamente:", {
      codigo: couponCode,
      orderId,
      descuento,
      total,
    });
  } catch (error) {
    console.error("Error canjeando cupón en WordPress:", error);
  }
}

async function handleCommit(req: NextRequest, data: RetornoTransbank) {
  const token = data.tokenWs || "";

  // Caso sin token_ws: puede ser transacción abortada, anulada o timeout.
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
          const pendingOrder = JSON.parse(pendingOrderStr) as PendingOrder;

          const customerId = pendingOrder.customerId
            ? parseInt(String(pendingOrder.customerId), 10)
            : 0;

          const billing = pendingOrder.formData
            ? {
                first_name: pendingOrder.formData.nombre || "",
                last_name: pendingOrder.formData.apellido || "",
                address_1: pendingOrder.formData.direccion || "",
                address_2: pendingOrder.formData.direccion2 || "",
                city: pendingOrder.formData.ciudad || "",
                state: pendingOrder.formData.region || "",
                postcode: "",
                country: "CL",
                email: pendingOrder.formData.email || "",
                phone: pendingOrder.formData.telefono || "",
              }
            : {};

          const shippingAddress = pendingOrder.formData
            ? {
                first_name: pendingOrder.formData.nombre || "",
                last_name: pendingOrder.formData.apellido || "",
                address_1: pendingOrder.formData.direccion || "",
                address_2: pendingOrder.formData.direccion2 || "",
                city: pendingOrder.formData.ciudad || "",
                state: pendingOrder.formData.region || "",
                postcode: "",
                country: "CL",
              }
            : {};

          const lineItems = pendingOrder.lineItems || [];

          const couponCode = String(pendingOrder.coupon?.code || "")
            .trim()
            .toUpperCase();

          const discountAmount = Number(
            pendingOrder.coupon?.discount || pendingOrder.totals?.discount || 0
          );

          const shippingCost = Number(
            pendingOrder.totals?.shipping ??
              pendingOrder.shipping?.cost ??
              0
          );

          const feeLines =
            couponCode && discountAmount > 0
              ? [
                  {
                    name: `Descuento cupón ${couponCode}`,
                    total: `-${discountAmount}`,
                  },
                ]
              : [];

          const shippingLines =
            shippingCost > 0
              ? [
                  {
                    method_id: "ofertando_envio",
                    method_title:
                      pendingOrder.shipping?.label || "Envío Ofertando",
                    total: String(shippingCost),
                  },
                ]
              : [];

          const metaData = [
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
            {
              key: "ofertando_order_id",
              value: pendingOrder.orderId || "",
            },
            {
              key: "ofertando_subtotal",
              value: String(pendingOrder.totals?.subtotal || ""),
            },
            {
              key: "ofertando_envio",
              value: String(shippingCost),
            },
            {
              key: "ofertando_total_final",
              value: String(
                pendingOrder.totals?.finalAmount || pendingOrder.amount || amount
              ),
            },
          ];

          if (couponCode && discountAmount > 0) {
            metaData.push(
              {
                key: "ofertando_cupon",
                value: couponCode,
              },
              {
                key: "ofertando_descuento_cupon",
                value: String(discountAmount),
              }
            );
          }

          const restPayload = {
            status: "processing",
            customer_id: customerId,
            billing,
            shipping: shippingAddress,
            line_items: lineItems,
            shipping_lines: shippingLines,
            fee_lines: feeLines,
            payment_method: "webpay_plus",
            payment_method_title: "Webpay Plus",
            transaction_id: tokenOriginal,
            meta_data: metaData,
          };

          console.log("PAYLOAD REST WOOCOMMERCE:", restPayload);

          const authHeader =
            "Basic " +
            Buffer.from(
              `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
            ).toString("base64");

          const wpUrl = getWordPressRestUrl();

          const wcResponse = await fetch(`${wpUrl}/wc/v3/orders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify(restPayload),
          });

          if (!wcResponse.ok) {
            const errorData = await wcResponse.json();
            console.error(
              "WooCommerce order creation failed:",
              wcResponse.status,
              errorData
            );

            // Aunque falle WooCommerce, el pago fue aprobado.
            // El cupón igual se registra como usado porque la compra fue pagada.
            await redeemCouponIfNeeded(pendingOrder);
          } else {
            const orderData = await wcResponse.json();

            console.log(
              "Orden creada en WooCommerce:",
              orderData.id,
              orderData.number
            );

            await redeemCouponIfNeeded(pendingOrder, orderData.id);
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

    // Pago rechazado
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
