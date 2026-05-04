import { ElementType, ReactNode, ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import styles from "./styles.module.scss";

type FluidContainerProps<T extends ElementType> = {
    as?: T;
    children?: ReactNode;
    className?: string;
    maxWidth?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className" | "maxWidth">;

export default function FluidContainer<T extends ElementType = "div">({
    children,
    as,
    className = "",
    maxWidth,
    ...props
}: FluidContainerProps<T>) {
    const Tag = as || "div";
    const style = maxWidth ? { maxWidth } : undefined;
    
    return (
        <Tag 
            data-testid="fluid-container" 
            className={clsx(styles["fluid-container"], className)} 
            style={style}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(props as any)}
        >
            {children}
        </Tag>
    );
}
