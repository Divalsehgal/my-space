"use client";

import { ReactNode } from "react";
import { Typography } from "@mui/material";
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
    return (
        <div className={clsx(styles["glass-card"], { [styles["glass-card--no-visual"]]: !visual }, className)}>
            {visual && <div className={styles["glass-card__visual"]}>
                {visual}
                <div className={styles["glass-card__visual-overlay"]} />
            </div>}

            <div className={styles["glass-card__content"]}>
                <div>
                    <h3 className={styles["glass-card__title"]}>{title}</h3>
                    <div className={styles["glass-card__description"]}>
                        {typeof description === "string" ? (
                            <Typography>{description}</Typography>
                        ) : (
                            <ul>
                                {description.map((item) => (
                                    <li key={item.id || item.text}>{item.text}</li>
                                ))}
                            </ul>
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
