import { NextResponse } from "next/server";
import { gql, GraphQLClient } from "graphql-request";

const REGISTER_CUSTOMER_MUTATION = gql`
  mutation RegisterCustomer($input: RegisterCustomerInput!) {
    registerCustomer(input: $input) {
      customer {
        id
        email
        username
        firstName
        lastName
      }
    }
  }
`;

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 },
      );
    }

    const client = new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_URL!, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await client.request(REGISTER_CUSTOMER_MUTATION, {
      input: {
        username: email,
        email,
        password,
        firstName,
        lastName: lastName || "",
      },
    });

    return NextResponse.json({
      success: true,
      customer: data.registerCustomer?.customer,
    });
  } catch (error: unknown) {
    const err = error as {
      response?: { errors?: Array<{ message: string }> };
      message?: string;
    };
    const errorMessage =
      err.response?.errors?.[0]?.message ||
      err.message ||
      "Error al registrar usuario";

    if (
      errorMessage.toLowerCase().includes("exists") ||
      errorMessage.toLowerCase().includes("email")
    ) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
