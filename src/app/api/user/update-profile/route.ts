import { NextResponse } from "next/server";
import { gql, GraphQLClient } from "graphql-request";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const UPDATE_CUSTOMER_MUTATION = gql`
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
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
  }
`;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      telefono,
      direccion,
      direccion2,
      ciudad,
      region,
    } = body;

    if (!firstName || !lastName || !direccion || !ciudad) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 },
      );
    }

    const wpToken = (session as { wpToken?: string }).wpToken;
    if (!wpToken) {
      return NextResponse.json(
        { error: "Token no disponible" },
        { status: 401 },
      );
    }

    const client = new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_URL!, {
      headers: {
        Authorization: `Bearer ${wpToken}`,
      },
    });

    const input: Record<string, unknown> = {
      billing: {
        firstName,
        lastName,
        address1: direccion,
        address2: direccion2 || "",
        city: ciudad,
        state: region,
        postcode: "",
        country: "CL",
        phone: telefono || "",
        email: session.user.email,
      },
      shipping: {
        firstName,
        lastName,
        address1: direccion,
        address2: direccion2 || "",
        city: ciudad,
        state: region,
        postcode: "",
        country: "CL",
      },
    };

    const data = await client.request(UPDATE_CUSTOMER_MUTATION, { input });

    return NextResponse.json({
      success: true,
      customer: data.updateCustomer?.customer,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    const err = error as {
      response?: { errors?: Array<{ message: string }> };
      message?: string;
    };
    const errorMessage =
      err.response?.errors?.[0]?.message ||
      err.message ||
      "Error al actualizar perfil";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
