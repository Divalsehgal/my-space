"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteIndex } from "@/lib/site-index";

const SiteIndexContext = createContext<SiteIndex | null>(null);

export function SiteIndexProvider({ index, children }: Readonly<{ index: SiteIndex; children: ReactNode }>) {
  return <SiteIndexContext.Provider value={index}>{children}</SiteIndexContext.Provider>;
}

/** The site index, or null outside the provider (e.g. isolated component tests). */
export function useSiteIndex() {
  return useContext(SiteIndexContext);
}
