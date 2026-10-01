import type { Metadata } from "next";
import NotFoundComponent from "@/components/NotFound";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundComponent />;
}
