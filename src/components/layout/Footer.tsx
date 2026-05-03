import Link from "next/link";
import { getClient } from "@/lib/apollo-server";
import { GET_LANDING_PAGE } from "@/graphql/queries/pages";

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

async function getFooterDescription(): Promise<string> {
  try {
    const { data } = await getClient().query({
      query: GET_LANDING_PAGE,
      variables: { id: "/inicio/", idType: "URI" },
    });
    const typed = data as LandingPageData;
    return typed?.page?.camposLanding?.subtitulo || "";
  } catch {
    return "";
  }
}

const footerLinks = {
  shop: [{ href: "/catalogo", label: "Catálogo" }],
  account: [
    { href: "/mi-cuenta", label: "Mi Cuenta" },
    { href: "/mi-cuenta/pedidos", label: "Mis Pedidos" },
  ],
  legal: [
    { href: "/privacidad", label: "Política de Privacidad" },
    { href: "/terminos", label: "Términos y Condiciones" },
  ],
};

export default async function Footer() {
  const footerDescription = await getFooterDescription();
  const description =
    footerDescription ||
    "Tu tienda online de ofertas. Productos de calidad con atención personalizada.";

  return (
    <footer className="print:hidden bg-[var(--surface)] border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center text-white">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
              <span className="text-lg font-semibold text-[var(--foreground)] tracking-tight">
                Ofertando
              </span>
            </Link>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              {description}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
              Tienda
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
              Mi Cuenta
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--border)] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} Ofertando. Todos los derechos
            reservados.
          </p>
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <span>Pago seguro</span>
            <svg
              className="w-4 h-4 text-[var(--success)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
