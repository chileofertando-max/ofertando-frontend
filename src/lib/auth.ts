import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

function getWordPressRestUrl() {
  const rawUrl =
    process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WP_REST_URL || "";

  if (!rawUrl) return "";

  // Debe quedar como: https://dominio.cl/wp-json
  let url = rawUrl.trim().replace(/\/+$/, "");

  // Si por error pusiste solo https://dominio.cl, agregamos /wp-json
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
          console.error(
            "Falta configurar WORDPRESS_API_URL o NEXT_PUBLIC_WP_REST_URL. Ejemplo: https://ofertando.cl/wp-json",
          );
          return null;
        }

        try {
          const res = await fetch(`${wpUrl}/jwt-auth/v1/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
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
              message: data?.message,
              code: data?.code,
            });

            // Importante: retornar null y no lanzar throw.
            // Así NextAuth responde como credenciales inválidas y no como error Configuration.
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
        token.wpToken = (user as { token?: string }).token;
        token.id = (user as { id?: string }).id;
        token.name = (user as { name?: string }).name;
        token.email = (user as { email?: string }).email;
      }
      return token;
    },
    async session({ session, token }) {
      const extendedSession = session as {
        wpToken?: string;
        user: { id?: string; email?: string; name?: string | null };
      };

      extendedSession.wpToken = token.wpToken as string | undefined;

      if (extendedSession.user) {
        extendedSession.user.id = token.id as string;
        extendedSession.user.email = token.email as string;
        extendedSession.user.name = token.name as string | null | undefined;
      }

      return extendedSession as typeof session;
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
  secret: process.env.NEXTAUTH_SECRET,
};
