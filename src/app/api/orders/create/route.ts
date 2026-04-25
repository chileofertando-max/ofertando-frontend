import { NextResponse } from "next/server";
import { gql, GraphQLClient } from "graphql-request";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      order {
        id
        orderId
        status
        total
        date
      }
    }
  }
`;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const wpToken = session ? (session as { wpToken?: string }).wpToken : null;

    const body = await request.json();
    const { orderId, amount, customerId, billing, lineItems } = body;

    if (!orderId || !amount || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 },
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (wpToken) {
      headers.Authorization = `Bearer ${wpToken}`;
    }

    const client = new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_URL!, {
      headers,
    });

    const input: Record<string, unknown> = {
      clientId: orderId,
      parent: null,
      status: "pending",
      mode: "default",
      paying: "full",
      completed: false,
      metaData: [],
    };

    if (customerId) {
      input.customerId = parseInt(String(customerId), 10);
    }

    if (billing) {
      input.billing = {
        firstName: billing.firstName,
        lastName: billing.lastName,
        address1: billing.address1,
        address2: billing.address2 || "",
        city: billing.city,
        state: billing.state,
        postcode: billing.postcode || "",
        country: billing.country || "CL",
        email: billing.email,
        phone: billing.phone || "",
      };
      input.shipping = {
        firstName: billing.firstName,
        lastName: billing.lastName,
        address1: billing.address1,
        address2: billing.address2 || "",
        city: billing.city,
        state: billing.state,
        postcode: billing.postcode || "",
        country: billing.country || "CL",
      };
    }

    if (lineItems && lineItems.length > 0) {
      input.lineItems = lineItems.map(
        (item: { id: string; quantity: number; price: number }) => ({
          productId: parseInt(item.id, 10),
          quantity: item.quantity,
          total: String(item.price * item.quantity),
        }),
      );
    }

    input.total = String(amount);

    const data = await client.request(CREATE_ORDER_MUTATION, { input });

    return NextResponse.json({
      success: true,
      order: data.createOrder?.order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    const err = error as {
      response?: { errors?: Array<{ message: string }> };
      message?: string;
    };
    const errorMessage =
      err.response?.errors?.[0]?.message ||
      err.message ||
      "Error al crear pedido";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
