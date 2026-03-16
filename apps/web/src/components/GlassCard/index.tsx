"use client";

import { ReactNode } from "react";
import { Typography } from "@mui/material";
import styles from "./styles.module.scss";

type Props = {
    readonly visual?: ReactNode;
    readonly title: ReactNode;
    readonly description: string;
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
        <div className={`${styles["glass-card"]} ${!visual ? styles["glass-card--no-visual"] : ""} ${className}`}>
            {visual && <div className={styles["glass-card__visual"]}>
                {visual}
                <div className={styles["glass-card__visual-overlay"]} />
            </div>}

            <div className={styles["glass-card__content"]}>
                <div>
                    <h2 className={styles["glass-card__title"]}>{title}</h2>
                    <Typography className={styles["glass-card__description"]}>
                        {description}
                    </Typography>
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
