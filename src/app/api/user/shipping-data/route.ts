import { NextResponse } from "next/server";
import { gql, GraphQLClient } from "graphql-request";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const GET_CUSTOMER = gql`
  query GetCurrentCustomer {
    customer {
      id
      email
      firstName
      lastName
      billing {
        address1
        address2
        city
        state
        postcode
        country
        phone
      }
      shipping {
        address1
        address2
        city
        state
        postcode
        country
      }
    }
  }
`;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const client = new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_URL!, {
      headers: {
        Authorization: `Bearer ${(session as { wpToken?: string }).wpToken}`,
      },
    });

    const data = await client.request(GET_CUSTOMER);
    const customer = data?.customer;

    if (!customer) {
      return NextResponse.json({ shippingData: null });
    }

    const shippingData = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      telefono: customer.billing?.phone || "",
      rut: "",
      direccion:
        customer.billing?.address1 || customer.shipping?.address1 || "",
      direccion2:
        customer.billing?.address2 || customer.shipping?.address2 || "",
      ciudad: customer.billing?.city || customer.shipping?.city || "",
      region: customer.billing?.state || customer.shipping?.state || "",
    };

    return NextResponse.json({ shippingData });
  } catch (error) {
    console.error("Error fetching shipping data:", error);
    return NextResponse.json(
      { error: "Error al obtener datos" },
      { status: 500 },
    );
  }
}
