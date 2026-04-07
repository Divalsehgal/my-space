/**
 * UI / component types that are shared across multiple components.
 * Component-private props interfaces should stay co-located with their component.
 */

export interface BreadcrumbItem {
    label: string;
    href: string;
}
