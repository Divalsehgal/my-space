
import "@dival-sehgal/design-tokens/light.css";
import "@dival-sehgal/design-tokens/dark.css";
import "@/styles/globals.scss";
import Navbar from "@/components/Navbar";
import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import { StackHans } from "@dival-sehgal/fonts/next";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import GoogleTracking from "@/components/GoogleTracking";

import { portfolioService } from "@/features/portfolio";
import Script from "next/script";

import GTMNoScript from "@/components/GTMNoScript";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://divalsehgal.vercel.app";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const ADS_ID = process.env.NEXT_PUBLIC_ADS_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var savedMode = window.localStorage.getItem("theme-mode");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var mode = savedMode === "light" || savedMode === "dark"
      ? savedMode
      : prefersDark
        ? "dark"
        : "light";

    document.documentElement.setAttribute("data-theme", mode);
    document.documentElement.style.colorScheme = mode;
  } catch (_) {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await portfolioService.getConfig();
  const title = config.metadata?.title || "Dival Sehgal | Senior Software Engineer";
  const tagline = config.hero?.subtitle || "Software Engineer specializing in Next.js and high-performance UI architecture.";
  const description = config.metadata?.description || `Portfolio of Dival Sehgal. ${tagline}`;
  const keywords = config.metadata?.keywords || ["Dival Sehgal", "Software Engineer", "Python", "Next.js", "Node.js", "TypeScript", "AWS", "Bangalore"];

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
    verification: {
      google: "wfB-Js_bQOmrLPlJupTds42zuCnMd-mQJO2Ebs_z558",
    },
    icons: {
      icon: "/icon.png",
      shortcut: "/icon.png",
      apple: "/icon.png",
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
  const { config } = await portfolioService.getConfig();

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning={true}>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <GoogleTracking gaId={GA_ID} adsId={ADS_ID} gtmId={GTM_ID} />
      </head>
      <body className={StackHans.variable} suppressHydrationWarning={true}>
        <GTMNoScript gtmId={GTM_ID} />
        <Providers>
          <Navbar brand={config?.navbar?.brand || "Portfolio"} />
          <main id="main-content">{children}</main>
          <Footer brand={config?.navbar?.brand || "Portfolio"} socialItems={config?.socials || []} />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
