import type { Metadata } from "next";
import NotFoundComponent from "@/components/NotFound";
import { getT } from "@/i18n/server";

export function generateMetadata(): Metadata {
  return {
    title: getT()("meta.notFoundTitle"),
    robots: { index: false, follow: true },
  };
}

export default function NotFound() {
  return <NotFoundComponent />;
}
