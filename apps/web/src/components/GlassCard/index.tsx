"use client";

import { ReactNode, useState } from "react";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import clsx from "clsx";
import styles from "./styles.module.scss";

type DescriptionItem = { id?: string; text: string };

type Props = {
    readonly visual?: ReactNode;
    readonly title: ReactNode;
    readonly description: string | Array<DescriptionItem>;
    readonly tags?: readonly string[];
    readonly action?: ReactNode;
    readonly className?: string;
};

const VISIBLE_COUNT = 2;

function ListDescription({ items }: { readonly items: readonly DescriptionItem[] }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hiddenCount = items.length - VISIBLE_COUNT;
    const hasHiddenItems = hiddenCount > 0;
    const visibleItems = isExpanded ? items : items.slice(0, VISIBLE_COUNT);

    const pluralSuffix = hiddenCount > 1 ? "s" : "";
    const toggleLabel = isExpanded
        ? "Show less"
        : `Show ${hiddenCount} more point${pluralSuffix}`;

    return (
        <div
            className={clsx(styles["glass-card__description"], {
                [styles["glass-card__description--scrollable"]]: isExpanded && hasHiddenItems,
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
                    className={styles["glass-card__accordion-toggle"]}
                    onClick={() => setIsExpanded((prev) => !prev)}
                    aria-expanded={isExpanded}
                >
                    <span>{toggleLabel}</span>
                    {isExpanded ? (
                        <KeyboardArrowUpIcon fontSize="small" />
                    ) : (
                        <KeyboardArrowDownIcon fontSize="small" />
                    )}
                </button>
            )}
        </div>
    );
}

export default function GlassCard({
    visual,
    title,
    description,
    tags,
    action,
    className = "",
}: Props) {
    return (
        <div className={clsx(styles["glass-card"], { [styles["glass-card--no-visual"]]: !visual }, className)}>
            {visual && <div className={styles["glass-card__visual"]}>
                {visual}
                <div className={styles["glass-card__visual-overlay"]} />
            </div>}

            <div className={styles["glass-card__content"]}>
                <div>
                    <h3 className={styles["glass-card__title"]}>{title}</h3>
                    {typeof description === "string" ? (
                        <div className={styles["glass-card__description"]}>
                            <Typography>{description}</Typography>
                        </div>
                    ) : (
                        <ListDescription items={description} />
                    )}
                </div>

                {tags && tags.length > 0 && (
                    <div className={styles["glass-card__tags"]}>
                        {tags.map((tag) => (
                            <div key={tag} className={styles["glass-card__tag"]}>
                                <span>{tag}</span>
                            </div>
                        ))}
                    </div>
                )}

                {action && <div className={styles["glass-card__action"]}>{action}</div>}
            </div>
        </div>
    );
}

