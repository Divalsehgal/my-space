"use client";

import type { ReactElement, ReactNode } from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import styles from "./styles.module.scss";

type TooltipProps = {
  title: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  /** A single focusable element (button, link) that the tooltip describes. */
  children: ReactElement;
};

/** Accessible tooltip (Radix): shows on hover and keyboard focus, Escape dismisses. */
export default function Tooltip({ title, side = "top", children }: Readonly<TooltipProps>) {
  return (
    <RadixTooltip.Provider delayDuration={250}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content side={side} sideOffset={6} className={styles.tooltip}>
            {title}
            <RadixTooltip.Arrow className={styles["tooltip__arrow"]} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
