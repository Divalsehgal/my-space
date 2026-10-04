import { useEffect, useState } from "react";
import { navLinks } from "../constants";

/** Scroll-spy: the nav href (e.g. "/#skills") of the home section in view, if any. */
export function useActiveSection(): string | null {
  const [activeHref, setActiveHref] = useState<string | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {return;}
    const sections = navLinks
      .map((link) => (link.href.startsWith("/#") ? document.getElementById(link.href.slice(2)) : null))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) {return;}
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {setActiveHref(`/#${visible[0].target.id}`);}
      },
      // A thin band across the middle of the viewport decides the active section.
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return activeHref;
}
