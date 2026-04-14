import { ElementType, ReactNode } from "react";
import styles from "./styles.module.scss";

type Props = {
    children: ReactNode;
    as?: ElementType;
    className?: string;
    [key: string]: any;
};

export default function FluidContainer({
    children,
    as,
    className = "",
    ...props
}: Props) {
    const Tag: any = as || "div";
    return (
        <Tag data-testid="fluid-container" className={`${styles["fluid-container"]} ${className}`} {...props}>
            {children}
        </Tag>
    );
}
