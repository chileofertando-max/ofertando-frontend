import { MetadataRoute } from "next";
import { getClient } from "@/lib/apollo-server";
import { GET_PRODUCT_SLUGS } from "@/graphql/queries/products";

const BASE_URL = "https://tudominio.cl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data } = await getClient().query({
      query: GET_PRODUCT_SLUGS,
      variables: { first: 100 },
    });

    const typedData = data as { products?: { nodes?: { slug: string }[] } };
    const productSlugs = typedData?.products?.nodes || [];

    const products = productSlugs.map((p) => ({
      url: `${BASE_URL}/catalogo/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${BASE_URL}/catalogo`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      ...products,
    ];
  } catch {
    return [
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${BASE_URL}/catalogo`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
    ];
  }
}
