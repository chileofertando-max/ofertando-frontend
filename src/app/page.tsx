import Link from "next/link";
import Image from "next/image";
import { getClient } from "@/lib/apollo-server";
import { GET_CATEGORIES } from "@/graphql/queries/categories";
import { GET_LANDING_PAGE } from "@/graphql/queries/pages";
import type { Category } from "@/types/product";

export const revalidate = 3600;

interface CamposLanding {
  textoHero?: string;
  subtitulo?: string;
  fondoHero?: {
    node?: {
      sourceUrl?: string;
    };
  };
}

interface LandingPageData {
  page?: {
    camposLanding?: CamposLanding;
  };
}

async function getCategories(): Promise<Category[]> {
  try {
    const { data } = await getClient().query({
      query: GET_CATEGORIES,
      variables: { first: 6 },
    });
    const typed = data as { productCategories?: { nodes: Category[] } };
    return typed?.productCategories?.nodes || [];
  } catch {
    return [];
  }
}

async function getLandingPageData(): Promise<CamposLanding | null> {
  try {
    const { data } = await getClient().query({
      query: GET_LANDING_PAGE,
      variables: { id: "/inicio/", idType: "URI" },
    });
    const typed = data as LandingPageData;
    return typed?.page?.camposLanding || null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [categories, landingData] = await Promise.all([
    getCategories(),
    getLandingPageData(),
  ]);

  const heroTitle = landingData?.textoHero || "Bienvenido a Ofertando";
  const heroSubtitle =
    landingData?.subtitulo ||
    "Descubre nuestra selección de productos de calidad con precios competitiva y atención personalizada vía WhatsApp.";
  const heroBackgroundUrl =
    landingData?.fondoHero?.node?.sourceUrl ||
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80";

  return (
    <div className="flex flex-col">
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroBackgroundUrl}
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-white/10" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
<div className="max-w-2xl">
              <h1 className="text-display-xl text-white mb-6 text-pretty">
              {heroTitle}
            </h1>
            <p className="text-body-lg text-white/90 mb-10 max-w-xl leading-relaxed">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-display-md text-[var(--foreground)] mb-3">
                Categorías
              </h2>
              <p className="text-body text-[var(--muted-foreground)]">
                Explora nuestra selección por categorías
              </p>
            </div>
            <Link
              href="/catalogo"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              Ver todas
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.length > 0
              ? categories.slice(0, 6).map((category, index) => (
                  <Link
                    key={category.id}
                    href={`/catalogo?categoria=${category.slug}`}
                    className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      index === 0 || index === 5
                        ? "md:col-span-2 md:row-span-2"
                        : ""
                    }`}
                  >
                    <div
                      className={`${index === 0 || index === 5 ? "aspect-square" : "aspect-square"} relative`}
                    >
                      {category.image?.sourceUrl ? (
                        <Image
                          src={category.image.sourceUrl}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-200" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                        <h3 className="font-semibold text-white text-lg mb-1">
                          {category.name}
                        </h3>
                        <p className="text-white/70 text-sm">
                          {category.count} productos
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-[var(--border-subtle)] rounded-2xl animate-pulse"
                  />
                ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center p-8 rounded-2xl bg-[var(--background)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition-colors">
              <div className="w-14 h-14 bg-[var(--accent-muted)] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-[var(--accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
              </div>
              <h3 className="text-heading-md text-[var(--foreground)] mb-3">
                Envíos Seguros
              </h3>
              <p className="text-body-sm text-[var(--muted-foreground)] leading-relaxed">
                Despachamos tus compras con cuidado y seguridad directamente a
                la puerta de tu casa.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-[var(--background)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition-colors">
              <div className="w-14 h-14 bg-[var(--success-muted)] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-[var(--success)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <h3 className="text-heading-md text-[var(--foreground)] mb-3">
                Calidad Asegurada
              </h3>
              <p className="text-body-sm text-[var(--muted-foreground)] leading-relaxed">
                Seleccionamos y revisamos cada producto para entregarte siempre
                lo mejor.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-[var(--background)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition-colors">
              <div className="w-14 h-14 bg-[var(--success-muted)] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-[var(--success)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                  />
                </svg>
              </div>
              <h3 className="text-heading-md text-[var(--foreground)] mb-3">
                Soporte WhatsApp
              </h3>
              <p className="text-body-sm text-[var(--muted-foreground)] leading-relaxed">
                Atención personalizada por WhatsApp para resolver todas tus
                dudas.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="max-w-md w-full text-center p-8 rounded-2xl bg-[var(--background)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition-colors">
              <div className="w-14 h-14 bg-[var(--accent-muted)] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-[var(--accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.215 0-4.335.163-6.332.404-1.841.219-3.444 1.445-4.125 3.231l-.233-.7A48.413 48.413 0 0112 12.75c2.058 0 4.098.56 5.944 1.536l.744.503c.313.21.574.5.574.848v2.133a3.5 3.5 0 01-3.5 3.5h-1.5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 18.75h2.25m0-4.5h-2.25m-5.25 0h2.25m0-4.5H9m2.25 0h2.25"
                  />
                </svg>
              </div>
              <h3 className="text-heading-md text-[var(--foreground)] mb-3">
                Vende con nosotros
              </h3>
              <p className="text-body-sm text-[var(--muted-foreground)] leading-relaxed mb-6">
                Únete a nuestra red de proveedores. Impulsa tus ventas
                ofreciendo tus productos en nuestra plataforma con todo nuestro
                respaldo.
              </p>
              <a
                href="https://wa.me/56978953903?text=Me%20gustar%C3%ADa%20unirme%20a%20la%20red%20de%20proveedores!"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-lg"
              >
                Enviar ficha
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
