import { ElementType, ReactNode } from "react";
import styles from "./styles.module.scss";

type Props = {
    children: ReactNode;
    as?: ElementType;
    className?: string;
    [key: string]: unknown;
};

export default function FluidContainer({
    children,
    as,
    className = "",
    ...props
}: Props) {
    const Tag = (as || "div") as any;
    return (
        <Tag data-testid="fluid-container" className={`${styles["fluid-container"]} ${className}`} {...props}>
            {children}
        </Tag>
    );
}
