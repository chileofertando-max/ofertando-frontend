"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RestablecerContrasenaPage() {
  const [login, setLogin] = useState("");
  const [key, setKey] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [linkValido, setLinkValido] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get("key") || "";
    const urlLogin = params.get("login") || "";

    if (!urlKey || !urlLogin) {
      setLinkValido(false);
      setError("El enlace de recuperación no es válido o está incompleto.");
      return;
    }

    setKey(urlKey);
    setLogin(urlLogin);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!password || password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/restablecer-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login,
          key,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.message ||
            "No se pudo restablecer la contraseña. Intenta nuevamente."
        );
        return;
      }

      setMensaje("Tu contraseña fue actualizada correctamente.");
      setPassword("");
      setConfirmPassword("");
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
              Crear nueva contraseña
            </h1>

            <p className="text-sm text-[var(--muted-foreground)]">
              Ingresa una nueva contraseña para acceder nuevamente a tu cuenta
              en Ofertando.cl.
            </p>
          </div>

          {mensaje ? (
            <div className="space-y-5">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                {mensaje}
              </div>

              <Link href="/login">
                <Button size="lg" className="w-full">
                  Ir a iniciar sesión
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-[var(--destructive-muted)] border border-[var(--destructive)]/20 rounded-xl text-[var(--destructive)] text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[var(--foreground)] mb-2"
                >
                  Nueva contraseña
                </label>

                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!linkValido}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-[var(--foreground)] mb-2"
                >
                  Confirmar nueva contraseña
                </label>

                <Input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={!linkValido}
                  placeholder="Repite tu nueva contraseña"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !linkValido}
                size="lg"
                className="w-full mt-6"
              >
                {isLoading ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </form>
          )}

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
