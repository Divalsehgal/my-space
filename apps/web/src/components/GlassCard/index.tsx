"use client";

import { ReactNode, useState } from "react";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import clsx from "clsx";
import styles from "./styles.module.scss";

type Props = {
    readonly visual?: ReactNode;
    readonly title: ReactNode;
    readonly description: string | Array<{ id?: string, text: string }>;
    readonly tags?: readonly string[];
    readonly action?: ReactNode;
    readonly className?: string;
};

export default function GlassCard({
    visual,
    title,
    description,
    tags,
    action,
    className = "",
}: Props) {
    const [isExpanded, setIsExpanded] = useState(false);

    const isArrayDescription = Array.isArray(description);
    const hasMoreThanThree = isArrayDescription && description.length > 3;

    let visibleItems: Array<{ id?: string; text: string }> = [];
    if (isArrayDescription) {
        visibleItems = isExpanded ? description : description.slice(0, 3);
    }

    return (
        <div className={clsx(styles["glass-card"], { [styles["glass-card--no-visual"]]: !visual }, className)}>
            {visual && <div className={styles["glass-card__visual"]}>
                {visual}
                <div className={styles["glass-card__visual-overlay"]} />
            </div>}

            <div className={styles["glass-card__content"]}>
                <div>
                    <h3 className={styles["glass-card__title"]}>{title}</h3>
                    <div
                        className={clsx(styles["glass-card__description"], {
                            [styles["glass-card__description--scrollable"]]: isExpanded && hasMoreThanThree,
                        })}
                    >
                        {typeof description === "string" ? (
                            <Typography>{description}</Typography>
                        ) : (
                            <>
                                <ul>
                                    {visibleItems.map((item, idx) => (
                                        <li key={item.id ?? item.text ?? idx}>{item.text}</li>
                                    ))}
                                </ul>
                                {hasMoreThanThree && (
                                    <button
                                        type="button"
                                        className={styles["glass-card__accordion-toggle"]}
                                        onClick={() => setIsExpanded((prev) => !prev)}
                                        aria-expanded={isExpanded}
                                    >
                                        <span>
                                            {isExpanded
                                                ? "Show less"
                                                : `Show ${description.length - 3} more point${description.length - 3 > 1 ? "s" : ""}`}
                                        </span>
                                        {isExpanded ? (
                                            <KeyboardArrowUpIcon fontSize="small" />
                                        ) : (
                                            <KeyboardArrowDownIcon fontSize="small" />
                                        )}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
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

