
import "./global.scss";
import Navbar from "@/components/Navbar";
import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import { StackHans } from "@dival-sehgal/fonts/next";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Script from "next/script";

import { portfolioService } from "@/features/portfolio";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://divalsehgal.vercel.app";

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
    verification: {
      google: "wfB-Js_bQOmrLPlJupTds42zuCnMd-mQJO2Ebs_z558",
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
  const { config } = await portfolioService.getConfig();

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const adsId = process.env.NEXT_PUBLIC_ADS_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID; // Keeping GTM support for future if needed

  return (
    <html lang="en" data-theme="light">
      <head>
        {(gaId || adsId) && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId || adsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${gaId ? `gtag('config', '${gaId}', { page_path: window.location.pathname, send_page_view: true });` : ""}
                ${adsId ? `gtag('config', 'AW-${adsId.includes("-") ? adsId.split("-")[1] : adsId}');` : ""}
              `}
            </Script>
          </>
        )}
        {gtmId && gtmId.startsWith("GTM-") && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        )}
      </head>
      <body className={StackHans.variable}>
        {gtmId && gtmId.startsWith("GTM-") && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <Providers>
          <Navbar brand={config?.navbar?.brand || "Portfolio"} />
          <main id="main-content">{children}</main>
          <Footer brand={config?.navbar?.brand || "Portfolio"} />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
