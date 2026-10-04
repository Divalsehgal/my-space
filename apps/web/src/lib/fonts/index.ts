import { Space_Grotesk } from "next/font/google";

// Display face for the hero name and section titles. Body copy stays on
// Stack Sans (see @dival-sehgal/fonts).
export const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});
