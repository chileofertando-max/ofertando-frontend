import { NextRequest, NextResponse } from "next/server";
import { webpay } from "@/lib/transbank";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const body = await req.json();

    const {
      amount,
      orderId,
      returnUrl,
      items,
      formData,
      coupon,
      totals,
      shipping,
    } = body;

    if (!amount || !orderId || !returnUrl) {
      return NextResponse.json(
        { success: false, error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    let safeCustomerId = 0;

    const email = formData?.email;

    if (email) {
      try {
        const authHeader =
          "Basic " +
          Buffer.from(
            `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
          ).toString("base64");

        const wpRes = await fetch(
          `${process.env.NEXT_PUBLIC_WP_REST_URL}/wc/v3/customers?email=${encodeURIComponent(
            email
          )}`,
          {
            method: "GET",
            headers: { Authorization: authHeader },
          }
        );

        if (wpRes.ok) {
          const customers = await wpRes.json();

          if (customers && customers.length > 0) {
            safeCustomerId = customers[0].id;
          }
        }
      } catch (error) {
        console.error("Error buscando cliente por email:", error);
      }
    }

    if (safeCustomerId === 0 && session?.user?.id) {
      safeCustomerId = Number(session.user.id);
    }

    const rawItems = items || [];

    const safeLineItems = rawItems.map((item: any) => {
      let rawId =
        item.databaseId ||
        item.productId ||
        item.id ||
        item.product_id ||
        item.databaseId;

      if (!rawId && item.product?.node) {
        rawId = item.product.node.databaseId;
      }

      let pId = Number(rawId);

      if (isNaN(pId) && typeof rawId === "string") {
        try {
          pId = Number(atob(rawId).split(":")[1]);
        } catch (e) {
          console.error("Error decodificando Base64:", rawId);
        }
      }

      if (!pId || isNaN(pId)) {
        console.error("Item corrupto en carrito:", item);
        throw new Error("No se pudo extraer el ID numérico del producto.");
      }

      return {
        product_id: pId,
        quantity: Number(item.quantity) || 1,
      };
    });

    if (safeLineItems.length === 0) {
      throw new Error(
        "El carrito está vacío o falló el mapeo antes de iniciar Webpay."
      );
    }

    const pendingOrder = {
      customerId: safeCustomerId,
      formData: formData || {},
      lineItems: safeLineItems,

      // Datos agregados para registrar correctamente el cupón al confirmar Webpay
      coupon: coupon || null,
      totals: totals || null,
      shipping: shipping || null,
      amount,
      orderId,
    };

    cookies().set("pending_order", JSON.stringify(pendingOrder), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30,
    });

    const buyOrder = `O-${Date.now()}`;
    const sessionId = `S-${Date.now()}`;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ofertando.cl";
    const returnUrlCommit = `${siteUrl.replace(
      /\/$/,
      ""
    )}/api/transbank/commit`;

    const response = await webpay.create(
      buyOrder,
      sessionId,
      amount,
      returnUrlCommit
    );

    return NextResponse.json({
      success: true,
      token: response.token,
      url: response.url,
    });
  } catch (error) {
    console.error("Transbank create error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al iniciar transacción",
      },
      { status: 500 }
    );
  }
}
