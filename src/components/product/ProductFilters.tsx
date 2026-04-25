"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { CategoryTree } from "@/types/product";

interface ProductFiltersProps {
  categories: CategoryTree[];
  currentCategory?: string;
  currentSort?: string;
}

const SORT_OPTIONS = [
  { value: "popularidad", label: "Popularidad" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "novedades", label: "Novedades" },
];

function CategoryItem({
  category,
  currentCategory,
  depth,
  onSelect,
}: {
  category: CategoryTree;
  currentCategory?: string;
  depth: number;
  onSelect: (slug: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(
    currentCategory?.startsWith(category.slug) || depth === 0,
  );
  const hasChildren = category.children.length > 0;
  const isActive = currentCategory === category.slug;
  const isAncestor =
    !isActive &&
    hasChildren &&
    category.children.some((child) => currentCategory?.startsWith(child.slug));

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const paddingLeft = depth * 1.5;

  return (
    <div>
      <div className="flex items-center">
        <button
          onClick={() => onSelect(category.slug)}
          className={`w-full text-left py-2 rounded-lg transition-all duration-200 flex justify-between items-center ${
            isActive
              ? "bg-[var(--accent-muted)] text-[var(--accent-hover)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
          } ${
            depth > 0
              ? "border-l-2 border-[var(--border-subtle)] pl-3 text-sm text-[var(--muted-foreground)]"
              : "text-sm font-medium pl-4"
          }`}
          style={{ paddingLeft: `${paddingLeft}rem` }}
        >
          <span className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={handleToggle}
                className="p-1 -ml-2 hover:bg-[var(--border-subtle)] rounded"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3 h-3 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            )}
            <span>{category.name}</span>
          </span>
          <span
            className={`text-xs pr-3 ${
              isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"
            }`}
          >
            {category.count}
          </span>
        </button>
      </div>
      {hasChildren && (isExpanded || isAncestor) && (
        <div className="overflow-hidden">
          {category.children.map((child) => (
            <CategoryItem
              key={child.databaseId}
              category={child}
              currentCategory={currentCategory}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductFilters({
  categories,
  currentCategory = "",
  currentSort = "popularidad",
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "popularidad" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/catalogo?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 uppercase tracking-wide">
          Categorías
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => updateParams("categoria", "")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              currentCategory === ""
                ? "bg-[var(--accent-muted)] text-[var(--accent-hover)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
            }`}
          >
            Todas las categorías
          </button>
          {categories.map((cat) => (
            <CategoryItem
              key={cat.databaseId}
              category={cat}
              currentCategory={currentCategory}
              depth={0}
              onSelect={(slug) => updateParams("categoria", slug)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 uppercase tracking-wide">
          Ordenar por
        </h3>
        <select
          value={currentSort}
          onChange={(e) => updateParams("orden", e.target.value)}
          className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] transition-all cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
