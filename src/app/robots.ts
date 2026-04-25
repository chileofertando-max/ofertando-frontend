import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/checkout/confirmacion"],
    },
    sitemap: "https://tudominio.cl/sitemap.xml",
  };
}
