"use client";

import { useEffect } from "react";

/**
 * ScrollSnapControl
 * 
 * Selectively applies the 'snap-mandatory' class to the document element 
 * while the component is mounted. This allows us to have mandatory 
 * scroll snapping on specific pages (like the Home Page) while maintaining 
 * proximity snapping on others (like Blogs).
 */
export default function ScrollSnapControl() {
  useEffect(() => {
    const html = document.documentElement;
    // Enable mandatory snapping and ensure behavior is auto during navigation setup
    html.classList.add("snap-mandatory");
    html.style.scrollBehavior = "auto";
    
    return () => {
      html.classList.remove("snap-mandatory");
      html.style.scrollBehavior = "";
      
      // Explicitly reset scroll position to top if needed during navigation out
      // although window.scrollTo(0,0) in target page is better.
    };
  }, []);

  return null;
}
