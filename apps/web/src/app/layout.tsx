
import "./global.scss";
import Navbar from "@/components/Navbar";
import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import { StackHans } from "@dival-sehgal/fonts/next";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

import { getPortfolioConfig } from "@/lib/config/portfolio";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://divalsehgal.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await getPortfolioConfig();
  const title = config.metadata?.title || "Dival Sehgal | Portfolio";
  const description = config.metadata?.description || "Personal portfolio of Dival Sehgal, a Full Stack Developer specializing in AI and modern web technologies.";
  const keywords = config.metadata?.keywords || ["Full Stack Developer", "AI Engineer", "Next.js", "React", "TypeScript"];

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
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { config } = await getPortfolioConfig();

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
