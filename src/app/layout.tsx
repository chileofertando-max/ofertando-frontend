import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import MetaPixel from "@/components/MetaPixel";
import { PageViewTracker } from "@/components/PageViewTracker";
import AuthProvider from "@/providers/AuthProvider";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ofertando",
  description: "Tu tienda online de ofertas",
  icons: {
    icon: "/favicon.svg",
  },
};

function MetaPixelLoader() {
  return (
    <Suspense fallback={null}>
      <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID || ""} />
    </Suspense>
  );
}

function PageViewTrackerWrapper() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" className={outfit.variable}>
      <body className="antialiased bg-[var(--background)] text-[var(--foreground)]">
        <AuthProvider>
          <MetaPixelLoader />
          <PageViewTrackerWrapper />
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <WhatsAppButton />
        </AuthProvider>
      </body>
    </html>
  );
}
