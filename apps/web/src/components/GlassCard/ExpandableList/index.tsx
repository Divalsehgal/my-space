"use client";

import { useState } from "react";
import clsx from "clsx";
import { KeyboardArrowDownIcon, KeyboardArrowUpIcon } from "@dival-sehgal/ui/icons";
import { useT } from "@/i18n/client";
import styles from "./styles.module.scss";

export type DescriptionItem = { id?: string; text: string };

const VISIBLE_COUNT = 2;

/** The only interactive part of a GlassCard: the "show N more" toggle. */
export default function ExpandableList({ items }: Readonly<{ items: readonly DescriptionItem[] }>) {
    const t = useT();
    const [isExpanded, setIsExpanded] = useState(false);

    const hiddenCount = items.length - VISIBLE_COUNT;
    const hasHiddenItems = hiddenCount > 0;
    const visibleItems = isExpanded ? items : items.slice(0, VISIBLE_COUNT);
    const toggleLabel = isExpanded ? t("card.showLess") : t.plural("card.showMore", hiddenCount);

    return (
        <div
            className={clsx(styles["expandable-list"], {
                [styles["expandable-list--scrollable"]]: isExpanded && hasHiddenItems,
            })}
        >
            <ul>
                {visibleItems.map((item, idx) => (
                    <li key={item.id ?? item.text ?? idx}>{item.text}</li>
                ))}
            </ul>
            {hasHiddenItems && (
                <button
                    type="button"
                    className={styles["expandable-list__toggle"]}
                    onClick={() => setIsExpanded((open) => !open)}
                    aria-expanded={isExpanded}
                >
                    <span>{toggleLabel}</span>
                    {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                </button>
            )}
        </div>
    );
}
