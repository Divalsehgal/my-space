"use client";

import type { ReactNode } from "react";
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
  readonly children: ReactNode;
}) {
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
