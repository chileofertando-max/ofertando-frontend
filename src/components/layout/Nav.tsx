"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/mi-cuenta", label: "Mi Cuenta" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navLinks.map((link) => {
        const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-300 ${
              isActive
                ? "bg-[var(--accent-muted)] text-[var(--accent-hover)]"
                : "text-gray-900 hover:bg-gray-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}