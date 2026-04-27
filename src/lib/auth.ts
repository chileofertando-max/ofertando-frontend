import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

function getWordPressRestUrl() {
  const rawUrl =
    process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WP_REST_URL || "";

  if (!rawUrl) {
    console.error(
      "Falta configurar WORDPRESS_API_URL o NEXT_PUBLIC_WP_REST_URL. Ejemplo: https://admin.ofertando.cl/wp-json"
    );
    return "";
  }

  let url = rawUrl.trim().replace(/\/+$/, "");

  if (!url.endsWith("/wp-json")) {
    url = `${url}/wp-json`;
  }

  return url;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "WordPress",
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },

      async authorize(credentials) {
        const username = credentials?.username?.trim().toLowerCase();
        const password = credentials?.password;

        if (!username || !password) {
          return null;
        }

        const wpUrl = getWordPressRestUrl();

        if (!wpUrl) {
          return null;
        }

        try {
          const res = await fetch(`${wpUrl}/jwt-auth/v1/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: new URLSearchParams({
              username,
              password,
            }),
            cache: "no-store",
          });

          const text = await res.text();
          let data: any = {};

          try {
            data = text ? JSON.parse(text) : {};
          } catch {
            console.error("WordPress no respondió JSON válido:", text);
            return null;
          }

          if (!res.ok || !data?.token) {
            console.error("Fallo login WordPress JWT:", {
              status: res.status,
              code: data?.code,
              message: data?.message,
            });

            return null;
          }

          return {
            id: String(data.user_id || data.id || data.user_email || username),
            name: data.user_display_name || data.user_nicename || "Usuario",
            email: data.user_email || username,
            token: data.token,
          };
        } catch (error) {
          console.error("Error conectando con WordPress JWT:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const wpUser = user as {
          id?: string;
          name?: string | null;
          email?: string | null;
          token?: string;
        };

        token.wpToken = wpUser.token;
        token.id = wpUser.id;
        token.name = wpUser.name;
        token.email = wpUser.email;
      }

      return token;
    },

    async session({ session, token }) {
      const extendedSession = session as typeof session & {
        wpToken?: string;
        user: {
          id?: string;
          email?: string | null;
          name?: string | null;
        };
      };

      extendedSession.wpToken = token.wpToken as string | undefined;

      if (extendedSession.user) {
        extendedSession.user.id = token.id as string | undefined;
        extendedSession.user.email = token.email as string | null | undefined;
        extendedSession.user.name = token.name as string | null | undefined;
      }

      return extendedSession;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  secret: authSecret,
};
