import type { Metadata } from "next";
import { getClient } from "@/lib/apollo-server";
import { GET_PAGE_BY_URI } from "@/graphql/queries/pages";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Ofertando",
  description: "Condiciones de uso de la tienda Ofertando",
};

interface PageProps {
  params: Promise<{ locale?: string }>;
}

async function getPage(uri: string) {
  try {
    const { data } = await getClient().query({
      query: GET_PAGE_BY_URI,
      variables: { uri },
      fetchPolicy: "no-cache",
    });
    console.log("Respuesta completa de la API:", JSON.stringify(data, null, 2));
    const typed = data as {
      nodeByUri?: { title: string; content: string; contentRendered: string } | null;
    };
    return typed?.nodeByUri || null;
  } catch {
    return null;
  }
}

export default async function TerminosPage({ params }: PageProps) {
  const page = await getPage("terminos");

  if (!page) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <h1 className="text-display-sm text-[var(--foreground)] mb-4">Términos y Condiciones</h1>
          <p className="text-[var(--muted-foreground)]">
            El contenido de esta página no está disponible actualmente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-display-sm text-[var(--foreground)] mb-8">
          {page.title}
        </h1>
        {(page.contentRendered || page.content) ? (
          <div
            className="text-gray-700 space-y-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.contentRendered || page.content }}
          />
        ) : (
          <p className="text-[var(--muted-foreground)]">
            El contenido de esta página no está disponible actualmente.
          </p>
        )}
      </div>
    </div>
  );
}
