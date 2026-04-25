"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const profileSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  telefono: z.string().optional(),
  rut: z.string().optional(),
  direccion: z.string().min(1, "La dirección es requerida"),
  direccion2: z.string().optional(),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  region: z.string().min(1, "La región es requerida"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function DatosPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      telefono: "",
      rut: "",
      direccion: "",
      direccion2: "",
      ciudad: "",
      region: "",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/mi-cuenta/datos");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email && status === "authenticated") {
      fetch("/api/user/shipping-data")
        .then((res) => res.json())
        .then((data) => {
          if (data.shippingData) {
            reset({
              nombre: data.shippingData.firstName || "",
              apellido: data.shippingData.lastName || "",
              telefono: data.shippingData.telefono || "",
              rut: data.shippingData.rut || "",
              direccion: data.shippingData.direccion || "",
              direccion2: data.shippingData.direccion2 || "",
              ciudad: data.shippingData.ciudad || "",
              region: data.shippingData.region || "",
            });
          }
        })
        .catch(console.error);
    }
  }, [session?.user?.email, status, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error al guardar");
      }

      setSubmitStatus("success");
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Error al guardar",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-display-sm text-[var(--foreground)] mb-2">
            Datos Personales
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Actualiza tu información de envío
          </p>
        </div>

        {submitStatus === "success" && (
          <div className="mb-6 p-4 bg-[var(--success-muted)] border border-[var(--success)]/20 rounded-xl text-[var(--success)] text-sm">
            Datos guardados correctamente
          </div>
        )}

        {submitStatus === "error" && (
          <div className="mb-6 p-4 bg-[var(--destructive-muted)] border border-[var(--destructive)]/20 rounded-xl text-[var(--destructive)] text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Nombre
              </label>
              <Input
                id="nombre"
                type="text"
                {...register("nombre")}
                error={errors.nombre?.message}
                placeholder="Juan"
              />
            </div>
            <div>
              <label
                htmlFor="apellido"
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Apellido
              </label>
              <Input
                id="apellido"
                type="text"
                {...register("apellido")}
                error={errors.apellido?.message}
                placeholder="Pérez"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="telefono"
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Teléfono
              </label>
              <Input
                id="telefono"
                type="tel"
                {...register("telefono")}
                error={errors.telefono?.message}
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div>
              <label
                htmlFor="rut"
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                RUT
              </label>
              <Input
                id="rut"
                type="text"
                {...register("rut")}
                error={errors.rut?.message}
                placeholder="12.345.678-9"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="direccion"
              className="block text-sm font-medium text-[var(--foreground)] mb-2"
            >
              Dirección
            </label>
            <Input
              id="direccion"
              type="text"
              {...register("direccion")}
              error={errors.direccion?.message}
              placeholder="Av. Principal 123, Depto 45"
            />
          </div>

          <div>
            <label
              htmlFor="direccion2"
              className="block text-sm font-medium text-[var(--foreground)] mb-2"
            >
              Dirección alternative (opcional)
            </label>
            <Input
              id="direccion2"
              type="text"
              {...register("direccion2")}
              error={errors.direccion2?.message}
              placeholder="Complemento de dirección"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="ciudad"
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Ciudad
              </label>
              <Input
                id="ciudad"
                type="text"
                {...register("ciudad")}
                error={errors.ciudad?.message}
                placeholder="Santiago"
              />
            </div>
            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Región
              </label>
              <Input
                id="region"
                type="text"
                {...register("region")}
                error={errors.region?.message}
                placeholder="Región Metropolitana"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full"
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
                Guardando...
              </span>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
