"use client";

import React, { useEffect } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeContextProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import dynamic from "next/dynamic";

// `ssr: false` already defers the Chatbot to the client, so it never renders
// during SSR and there's no need to gate it behind a mounted flag.
const Chatbot = dynamic(() => import("@/components/Chatbot"), { ssr: false });

export default function Providers({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  // PWA has been removed. Unregister any previously-installed service workers
  // and purge their caches so returning visitors stop getting stale content.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
    if ("caches" in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      });
    }
  }, []);

  return (
    <ThemeContextProvider>
      <CssBaseline />
      <ToastProvider>
        {children}
        <Chatbot />
      </ToastProvider>
    </ThemeContextProvider>
  );
}
