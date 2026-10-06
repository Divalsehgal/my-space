"use client";

import type { ReactNode } from "react";
import { ContentfulLivePreviewProvider } from "@contentful/live-preview/react";

/** Contentful's default locale; live updates are matched against this. */
const CONTENTFUL_LOCALE = "en-US";

/**
 * Connects the page to Contentful's Live Preview pane so `useContentfulLiveUpdates`
 * receives draft edits. Only mounted on preview routes.
 */
export default function LivePreviewProvider({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ContentfulLivePreviewProvider locale={CONTENTFUL_LOCALE} enableLiveUpdates enableInspectorMode={false}>
      {children}
    </ContentfulLivePreviewProvider>
  );
}
