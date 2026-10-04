"use client";

import { useEffect } from "react";

/** Starts the page at the top on arrival, without the smooth-scroll animation. */
export default function ScrollToTopOnMount() {
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    return () => {
      html.style.scrollBehavior = previous;
    };
  }, []);
  return null;
}
