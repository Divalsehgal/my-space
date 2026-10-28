"use client";

import { useState, type ReactElement } from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import styles from "./styles.module.scss";

type LinkPreviewProps = {
  /** Screenshot of the linked page; only requested once the preview first opens. */
  src: string;
  alt: string;
  /** Hostname or short label shown in the preview's address bar. */
  label?: string;
  side?: "top" | "right" | "bottom" | "left";
  /** A single focusable link the preview describes. */
  children: ReactElement;
};

type Status = "loading" | "loaded" | "error";

/**
 * Hover/focus card showing a screenshot of where a link goes. Portalled, so it
 * isn't clipped by `overflow: hidden` parents (cards, carousels). Radix only
 * opens on mouse hover and keyboard focus, so touch devices just follow the link.
 */
export default function LinkPreview({ src, alt, label, side = "top", children }: Readonly<LinkPreviewProps>) {
  const [status, setStatus] = useState<Status>("loading");

  return (
    <RadixTooltip.Provider delayDuration={300}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content side={side} sideOffset={10} collisionPadding={16} className={styles["link-preview"]}>
            <div className={styles["link-preview__bar"]} aria-hidden="true">
              <span className={styles["link-preview__dots"]} />
              {label && <span className={styles["link-preview__url"]}>{label}</span>}
            </div>
            <div className={styles["link-preview__frame"]} data-status={status}>
              {status === "error" ? (
                <span className={styles["link-preview__fallback"]}>{label ?? alt}</span>
              ) : (
                // A plain <img>: the screenshot host is arbitrary, so next/image's
                // remotePatterns allow-list doesn't apply here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={alt}
                  className={styles["link-preview__image"]}
                  onLoad={() => setStatus("loaded")}
                  onError={() => setStatus("error")}
                />
              )}
            </div>
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
