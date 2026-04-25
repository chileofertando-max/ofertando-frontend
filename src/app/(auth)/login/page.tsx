import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Iniciar Sesión | Ofertando",
  description: "Accede a tu cuenta en Ofertando",
};

function LoginFallback() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-8">
        <div className="animate-pulse space-y-4">
          <div className="w-14 h-14 bg-[var(--border-subtle)] rounded-2xl mx-auto mb-4" />
          <div className="h-7 bg-[var(--border-subtle)] rounded w-1/2 mx-auto mb-2" />
          <div className="h-4 bg-[var(--border-subtle)] rounded w-3/4 mx-auto mb-6" />
          <div className="space-y-3">
            <div className="h-12 bg-[var(--border-subtle)] rounded-xl" />
            <div className="h-12 bg-[var(--border-subtle)] rounded-xl" />
            <div className="h-12 bg-[var(--border-subtle)] rounded-xl mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}