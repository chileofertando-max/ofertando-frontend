import { NextRequest, NextResponse } from "next/server";
import { webpay } from "@/lib/transbank";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token_ws = searchParams.get("token_ws");

    if (!token_ws) {
      return NextResponse.json(
        { success: false, error: "Token requerido" },
        { status: 400 }
      );
    }

    const response = await webpay.status(token_ws);

    return NextResponse.json({
      success: true,
      data: {
        status: response.status,
        amount: response.amount,
        buyOrder: response.buyOrder,
        sessionId: response.sessionId,
        transactionDate: response.transactionDate,
      },
    });
  } catch (error) {
    console.error("Transbank status error:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar estado" },
      { status: 500 }
    );
  }
}
