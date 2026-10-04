
import "@dival-sehgal/design-tokens/light.css";
import "@dival-sehgal/design-tokens/dark.css";
import "@/styles/globals.scss";
import * as LightTokens from "@dival-sehgal/design-tokens/light";
import * as DarkTokens from "@dival-sehgal/design-tokens/dark";
import Navbar from "@/components/Navbar";
import type { Metadata, Viewport } from "next";
import ViewTransition from "@/components/ViewTransition";
import Providers from "@/components/Providers";
import { SiteIndexProvider } from "@/components/SiteIndex";
import CommandCenter from "@/components/CommandCenter";
import ClickTracker from "@/components/ClickTracker";
import SpotlightTracker from "@/components/Spotlight";
import { buildSiteIndex } from "@/lib/site-index";
import { getT } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { getContentfulPostTitles } from "@/lib/services/contentful";
import { StackHans } from "@dival-sehgal/fonts/next";
import { displayFont } from "@/lib/fonts";
import SmoothScroll from "@/components/SmoothScroll";
import GamePrompt from "@/components/GamePrompt";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import GoogleTracking from "@/components/GoogleTracking";

import { flattenSkillNames, portfolioService } from "@/features/portfolio";
import Script from "next/script";

import GTMNoScript from "@/components/GTMNoScript";

import { SITE_URL as BASE_URL } from "@/lib/config/site";

/** Search engines truncate descriptions around 155-160 characters. */
const META_DESCRIPTION_MAX = 158;
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
  // Browser chrome matches the page background in each colour scheme.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: LightTokens.TColorsBackgroundPrimary },
    { media: "(prefers-color-scheme: dark)", color: DarkTokens.TColorsBackgroundPrimary },
  ],
};

export function generateMetadata(): Metadata {
  const t = getT();
  const title = t("meta.title");
  const fullDescription = t("meta.description");
  // Search engines truncate around 155-160 characters; cut at a word boundary.
  const description =
    fullDescription.length <= META_DESCRIPTION_MAX
      ? fullDescription
      : `${fullDescription.slice(0, fullDescription.lastIndexOf(" ", META_DESCRIPTION_MAX - 1))}…`;
  const keywords = t("meta.keywords").split(",").map((keyword) => keyword.trim()).filter(Boolean);

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
          url: "/og-image.jpg",
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
      images: ["/og-image.jpg"],
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
    verification: {
      google: "wfB-Js_bQOmrLPlJupTds42zuCnMd-mQJO2Ebs_z558",
    },
    icons: {
      // Sized icons: the original 512px icon.png is 364 KB, far too heavy
      // for a browser tab.
      icon: [
        { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      shortcut: "/icon-32.png",
      apple: "/apple-icon.png",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  /** Intercepted routes shown as modals, e.g. /architecture. */
  modal?: React.ReactNode;
}>) {
  const { config } = await portfolioService.getConfig();
  const posts = await getContentfulPostTitles();
  const t = getT(DEFAULT_LOCALE);
  const siteIndex = buildSiteIndex(config, posts ?? [], t);

  return (
    <html lang={DEFAULT_LOCALE} data-theme="light" suppressHydrationWarning={true}>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <GoogleTracking gaId={GA_ID} adsId={ADS_ID} gtmId={GTM_ID} />
      </head>
      <body className={`${StackHans.variable} ${displayFont.variable}`} suppressHydrationWarning={true}>
        <GTMNoScript gtmId={GTM_ID} />
        <a href="#main-content" className="skip-link">
          {t("common.skipToContent")}
        </a>
        <I18nProvider locale={DEFAULT_LOCALE}>
        <SiteIndexProvider index={siteIndex}>
        <Providers>
          <SmoothScroll />
          <Navbar brand={t("common.siteName")} />
          <ViewTransition>
            <main id="main-content">{children}</main>
          </ViewTransition>
          {modal}
          <Footer brand={t("common.siteName")} socialItems={config?.socials || []} />
          <ScrollToTop />
          <GamePrompt items={flattenSkillNames(config?.skills ?? {})} />
          <CommandCenter />
          <ClickTracker />
          <SpotlightTracker />
        </Providers>
        </SiteIndexProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
