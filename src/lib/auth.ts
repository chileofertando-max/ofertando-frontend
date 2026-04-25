import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "WordPress",
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const wpUrl =
          process.env.NEXT_PUBLIC_WP_REST_URL || process.env.WORDPRESS_API_URL;

        try {
          const res = await fetch(`${wpUrl}/jwt-auth/v1/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            console.error(
              "Fallo JWT. Código HTTP:",
              res.status,
              "Respuesta:",
              data,
            );
            throw new Error(data.message || "Credenciales inválidas");
          }

          if (res.ok && data.token) {
            return {
              id: data.user_id || data.id || "1",
              name: data.user_display_name || "Usuario",
              email: data.user_email || credentials.username,
              token: data.token,
            };
          }
        } catch (error) {
          console.error("Error en authorize:", error);
          throw error;
        }

        return null;
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
