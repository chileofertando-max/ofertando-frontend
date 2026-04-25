import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getClient } from "@/lib/apollo-server";
import { GET_PRODUCT_BY_SLUG } from "@/graphql/queries/products";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductTabs } from "@/components/product/ProductTabs";
import { ProductGallery } from "@/components/product/ProductGallery";
import type { Product } from "@/types/product";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const { data } = await getClient().query({
      query: GET_PRODUCT_BY_SLUG,
      variables: { slug },
      fetchPolicy: "no-cache",
    });
    return (data as { product?: Product })?.product || null;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Producto no encontrado | Ofertando",
    };
  }

  return {
    title: `${product.name} | Ofertando`,
    description: product.shortDescription?.replace(/<[^>]*>/g, "") || `Comprar ${product.name}`,
    openGraph: {
      title: product.name,
      description: product.shortDescription?.replace(/<[^>]*>/g, "") || "",
      images: product.image?.sourceUrl
        ? [{ url: product.image.sourceUrl, width: 800, height: 800 }]
        : [],
      type: "website" as const,
      locale: "es_CL",
    },
    alternates: {
      canonical: `https://tudominio.cl/catalogo/${slug}`,
    },
  };
}

function buildJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription?.replace(/<[^>]*>/g, "") || "",
    image: product.image?.sourceUrl || "",
    offers: {
      "@type": "Offer",
      priceCurrency: "CLP",
      price: product.price || "0",
      availability:
        product.stockStatus === "IN_STOCK"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
    return;
  }

  const jsonLd = buildJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-8">
            <a href="/" className="hover:text-[var(--foreground)] transition-colors">Inicio</a>
            <span className="text-[var(--border)]">/</span>
            <a href="/catalogo" className="hover:text-[var(--foreground)] transition-colors">Catálogo</a>
            <span className="text-[var(--border)]">/</span>
            <span className="text-[var(--foreground)] truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <ProductGallery
              mainImage={product.image}
              galleryImages={product.galleryImages?.nodes || []}
              productName={product.name}
            />
            <ProductDetail product={product} />
          </div>

          <div className="mt-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] px-6 lg:px-10">
            <ProductTabs
              description={product.description || ""}
              shortDescription={product.shortDescription || ""}
            />
          </div>
        </div>
      </div>
    </>
  );
}