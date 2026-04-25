"use client";

import { useState } from "react";

interface ProductTabsProps {
  description: string;
  shortDescription: string;
}

export function ProductTabs({ description, shortDescription }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"descripcion" | "informacion">("descripcion");

  return (
    <div className="border-t border-[var(--border)]">
      <div className="flex gap-8">
        <button
          onClick={() => setActiveTab("descripcion")}
          className={`pb-4 pt-6 px-1 font-medium text-sm transition-all duration-200 border-b-2 relative ${
            activeTab === "descripcion"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Descripción
        </button>
        <button
          onClick={() => setActiveTab("informacion")}
          className={`pb-4 pt-6 px-1 font-medium text-sm transition-all duration-200 border-b-2 relative ${
            activeTab === "informacion"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Información adicional
        </button>
      </div>

      <div className="py-8">
        {activeTab === "descripcion" && (
          <div
            className="prose prose-sm max-w-none text-[var(--muted-foreground)] leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: description || shortDescription || "<p>Sin descripción disponible.</p>",
            }}
          />
        )}
        {activeTab === "informacion" && (
          <div className="text-[var(--muted-foreground)] leading-relaxed">
            <p>Información adicional del producto.</p>
          </div>
        )}
      </div>
    </div>
  );
}