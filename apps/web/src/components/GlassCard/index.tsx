import type { ReactNode } from "react";

import clsx from "clsx";
import styles from "./styles.module.scss";
import ExpandableList, { type DescriptionItem } from "./ExpandableList";

type Props = {
    readonly visual?: ReactNode;
    readonly title: ReactNode;
    /** A line under the title (e.g. the company), so the heading itself stays short. */
    readonly subtitle?: ReactNode;
    readonly description: string | Array<DescriptionItem>;
    readonly tags?: readonly string[];
    readonly action?: ReactNode;
    readonly className?: string;
};

export default function GlassCard({
    visual,
    title,
    subtitle,
    description,
    tags,
    action,
    className = "",
}: Props) {
    return (
        <div
            data-spotlight
            data-reveal
            className={clsx(styles["glass-card"], { [styles["glass-card--no-visual"]]: !visual }, className)}
        >
            {visual && <div className={styles["glass-card__visual"]}>
                {visual}
                <div className={styles["glass-card__visual-overlay"]} />
            </div>}

            <div className={styles["glass-card__content"]}>
                <div>
                    <h3 className={styles["glass-card__title"]}>{title}</h3>
                    {subtitle && <p className={styles["glass-card__subtitle"]}>{subtitle}</p>}
                    {typeof description === "string" ? (
                        <div className={styles["glass-card__description"]}>
                            <p className={styles["glass-card__text"]}>{description}</p>
                        </div>
                    ) : (
                        <ExpandableList items={description} />
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

