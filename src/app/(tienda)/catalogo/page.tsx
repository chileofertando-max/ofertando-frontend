import { Suspense } from "react";
import type { Metadata } from "next";
import { getClient } from "@/lib/apollo-server";
import { GET_PRODUCTS } from "@/graphql/queries/products";
import { GET_CATEGORIES } from "@/graphql/queries/categories";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters } from "@/components/product/ProductFilters";
import {
  buildCategoryTree,
  getAllDescendantIds,
  getCategoryBreadcrumb,
} from "@/lib/categories";
import type { Product, Category } from "@/types/product";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Catálogo | Ofertando",
  description: "Explora todos nuestros productos",
};

interface PageProps {
  searchParams: Promise<{ categoria?: string; orden?: string; page?: string }>;
}

const ORDER_MAP = {
  price_asc: { field: "PRICE", order: "ASC" },
  price_desc: { field: "PRICE", order: "DESC" },
  novedades: { field: "DATE", order: "DESC" },
  popularidad: { field: "POPULARITY", order: "DESC" },
} as const;

type OrderKey = keyof typeof ORDER_MAP;

async function getProducts(
  categoryIdIn?: number[],
  categorySlug?: string,
  orden?: string,
): Promise<Product[]> {
  const orderConfig =
    orden && ORDER_MAP[orden as OrderKey]
      ? ORDER_MAP[orden as OrderKey]
      : { field: "DATE", order: "DESC" };

  try {
    const { data } = await getClient().query({
      query: GET_PRODUCTS,
      variables: {
        categoryIdIn: categoryIdIn || null,
        categorySlug: categoryIdIn?.length ? null : categorySlug || null,
        field: orderConfig.field,
        order: orderConfig.order,
      },
      fetchPolicy: "no-cache",
    });
    const typed = data as { products?: { nodes: Product[] } };
    return typed?.products?.nodes || [];
  } catch (error) {
    console.error("ERROR fetching products:", error);
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const { data } = await getClient().query({
      query: GET_CATEGORIES,
      variables: { first: 20 },
    });
    const typed = data as { productCategories?: { nodes: Category[] } };
    return typed?.productCategories?.nodes || [];
  } catch {
    return [];
  }
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const categoriaSlug = resolvedSearchParams.categoria;

  const [products, categories] = await Promise.all([
    getProducts(undefined, categoriaSlug, resolvedSearchParams.orden),
    getCategories(),
  ]);

  const categoryTree = buildCategoryTree(categories);

  let categoryIdIn: number[] | undefined;
  let categoryName: string | null = null;
  let breadcrumb: { name: string; slug: string }[] = [];

  if (categoriaSlug) {
    const selectedCategory = categoryTree.find((c) => c.slug === categoriaSlug);
    if (selectedCategory) {
      categoryIdIn = getAllDescendantIds(selectedCategory);
      categoryName = selectedCategory.name;
      breadcrumb = getCategoryBreadcrumb(categoryTree, categoriaSlug).map(
        (c) => ({ name: c.name, slug: c.slug }),
      );

      const productsByDescendants = await getProducts(
        categoryIdIn,
        undefined,
        resolvedSearchParams.orden,
      );
      if (productsByDescendants.length > 0) {
        products.length = 0;
        products.push(...productsByDescendants);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6">
                <Suspense
                  fallback={
                    <div className="animate-pulse h-64 bg-[var(--border-subtle)] rounded-xl" />
                  }
                >
                  <ProductFilters
                    categories={categoryTree}
                    currentCategory={resolvedSearchParams.categoria}
                    currentSort={resolvedSearchParams.orden}
                  />
                </Suspense>
              </div>
            </div>
          </aside>

          <main>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-display-sm text-[var(--foreground)]">
                  {categoryName || "Todos los Productos"}
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {products.length}{" "}
                  {products.length === 1 ? "producto" : "productos"}
                </p>
              </div>
            </div>

            {categoriaSlug && (
              <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
                <a
                  href="/"
                  className="hover:text-[var(--foreground)] transition-colors"
                >
                  Inicio
                </a>
                <span>/</span>
                <a
                  href="/catalogo"
                  className="hover:text-[var(--foreground)] transition-colors"
                >
                  Catálogo
                </a>
                {breadcrumb.map((item, idx) => (
                  <span key={item.slug} className="flex items-center gap-2">
                    <span>/</span>
                    <a
                      href={`/catalogo?categoria=${item.slug}`}
                      className={`hover:text-[var(--foreground)] transition-colors ${idx === breadcrumb.length - 1 ? "text-[var(--foreground)] font-medium" : ""}`}
                    >
                      {item.name}
                    </a>
                  </span>
                ))}
              </nav>
            )}

            <Suspense fallback={<ProductGrid products={products} loading />}>
              <ProductGrid products={products} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
