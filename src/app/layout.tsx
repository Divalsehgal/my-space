// src/app/layout.tsx
import type { Metadata } from "next";
import "../styles/global.scss";
import Providers from "./providers"; 

export const metadata: Metadata = {
  title: "Dival Sehgal — Portfolio",
  description:
    "Portfolio and blog of Dival Sehgal — Frontend Developer focused on Next.js, React, and design systems.",
  icons: {
    icon: "/favicon.ico",
  },
  themeColor: "#0b5fff",
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      {/* data-theme can toggle between light/dark */}
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
