"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function BackgroundPattern() {
  const { scrollY } = useScroll();
  
  // Subtle parallax: move background at 10% of scroll speed with an offset to prevent gaps
  const y = useTransform(scrollY, [0, 1000], [-50, 50]);

  return (
    <motion.div
      style={{ 
        y,
        height: "120%", // Extra height to allow for movement without gaps
        top: "-10%" 
      }}
      className="section__bg-pattern"
    />
  );
}
