
import "./global.scss";
import Navbar from "@/components/Navbar";
import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import { StackHans } from "@dival-sehgal/fonts/next";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

import { portfolioService } from "@/features/portfolio";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://divalsehgal.vercel.app");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await portfolioService.getConfig();
  const title = config.metadata?.title || "Dival Sehgal | Senior Frontend Engineer";
  const tagline = config.hero?.subtitle || "Frontend Engineer specializing in Next.js and high-performance UI architecture.";
  const description = config.metadata?.description || `Portfolio of Dival Sehgal. ${tagline}`;
  const keywords = config.metadata?.keywords || ["Dival Sehgal", "Frontend Engineer", "Next.js", "React", "TypeScript", "Bangalore"];

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    keywords,
    authors: [{ name: "Dival Sehgal", url: BASE_URL }],
    creator: "Dival Sehgal",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: BASE_URL,
      title,
      description,
      siteName: title,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@divalsehgal",
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: BASE_URL,
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: title,
    },
    formatDetection: {
      telephone: false,
    },
    verification: {
      google: config.metadata?.verification?.google,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { config } = await portfolioService.getConfig();

  return (
    <html lang="en" data-theme="light">
      <body className={StackHans.variable}>
        <Providers>
          <Navbar brand={config.navbar?.brand || "Portfolio"} />
          <main id="main-content">{children}</main>
          <Footer brand={config.navbar?.brand || "Portfolio"} />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
