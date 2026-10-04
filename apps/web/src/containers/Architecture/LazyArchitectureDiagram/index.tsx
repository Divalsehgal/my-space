"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ArchitectureEdgeConfig, ArchitectureNodeConfig } from "@/features/portfolio";
import styles from "./styles.module.scss";

// React Flow (@xyflow/react) is heavy and the diagram sits far down the page,
// so its chunk is fetched only when the section approaches the viewport.
const ArchitectureDiagram = dynamic(() => import("../ArchitectureDiagram"), {
  ssr: false,
  loading: () => <div className={styles.placeholder} aria-hidden="true" />,
});

interface LazyArchitectureDiagramProps {
  nodes: ArchitectureNodeConfig[];
  edges: ArchitectureEdgeConfig[];
}

export default function LazyArchitectureDiagram(props: Readonly<LazyArchitectureDiagramProps>) {
  const anchor = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = anchor.current;
    if (!el) {return;}
    // Phones use the stacked ArchitectureTiers view; never fetch React Flow there.
    if (typeof window.matchMedia === "function" && !window.matchMedia("(min-width: 768px)").matches) {return;}
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={anchor} className={styles.anchor}>
      {near ? <ArchitectureDiagram {...props} /> : <div className={styles.placeholder} aria-hidden="true" />}
    </div>
  );
}
