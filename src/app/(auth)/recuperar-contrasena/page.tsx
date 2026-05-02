"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMensaje("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/recuperar-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.message ||
            "No se pudo enviar la solicitud. Intenta nuevamente."
        );
        return;
      }

      setMensaje(
        "Si el correo está registrado, recibirás un enlace para crear una nueva contraseña."
      );
      setEmail("");
    } catch {
      setError("Error al conectar con el servidor. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[var(--accent-muted)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-[var(--accent)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V7.5a4.5 4.5 0 10-9 0v3m-.75 0h10.5A1.5 1.5 0 0118.75 12v7.5A1.5 1.5 0 0117.25 21H6.75a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5z"
                />
              </svg>
            </div>

            <h1 className="text-heading-lg text-[var(--foreground)] mb-2">
              Recuperar contraseña
            </h1>

            <p className="text-sm text-[var(--muted-foreground)]">
              Ingresa tu correo registrado en Ofertando.cl y te enviaremos las
              instrucciones para crear una nueva contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mensaje && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                {mensaje}
              </div>
            )}

            {error && (
              <div className="p-4 bg-[var(--destructive-muted)] border border-[var(--destructive)]/20 rounded-xl text-[var(--destructive)] text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Email
              </label>

              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.cl"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full mt-6"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Enviando...
                </span>
              ) : (
                "Enviar instrucciones"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              href="/login"
              className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
