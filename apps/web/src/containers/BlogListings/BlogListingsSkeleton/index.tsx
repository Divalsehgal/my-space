import Skeleton from "@dival-sehgal/ui/skeleton";
import FluidContainer from "@/components/FluidContainer";
import {
    TSpacing2,
    TSpacing4,
    TColorsBackgroundTertiary,
    TColorsBackgroundSecondary,
    TColorsBorderDefault,
} from "@dival-sehgal/design-tokens/variables.js";
import styles from "./styles.module.scss";

const SKELETON_CARD_IDS = [
    "blog-skeleton-1",
    "blog-skeleton-2",
    "blog-skeleton-3",
    "blog-skeleton-4",
    "blog-skeleton-5",
    "blog-skeleton-6",
];

interface BlogListingsSkeletonProps {
    skipBreadcrumbs?: boolean;
}

export default function BlogListingsSkeleton({ skipBreadcrumbs = false }: BlogListingsSkeletonProps) {
    const content = (
        <div className={`${styles["skeleton-page"]} ${styles.blogs}`}>
            <FluidContainer>
                <div className={styles["blogs__container"]}>
                    <div className={styles["blogs__header"]}>
                        <Skeleton
                            variant="text"
                            width="40%"
                            height={64}
                            style={{ marginInline: 'auto', marginBottom: TSpacing2, backgroundColor: TColorsBackgroundTertiary }}
                        />
                        <Skeleton
                            variant="text"
                            width="30%"
                            height={24}
                            style={{ marginInline: 'auto', backgroundColor: TColorsBackgroundTertiary }}
                        />
                    </div>

                    {/* Featured Carousel Skeleton */}
                    <div style={{ marginBottom: TSpacing4 }}>
                        <Skeleton
                            variant="rectangular"
                            width="100%"
                            height={450}
                            style={{
                                borderRadius: '2rem',
                                backgroundColor: TColorsBackgroundTertiary,
                                border: `1px solid ${TColorsBorderDefault}`
                            }}
                        />
                    </div>

                    {/* Search Section Skeleton */}
                    <div className={styles["blogs__search-container"]}>
                        <Skeleton
                            variant="text"
                            width={120}
                            height={40}
                            style={{ backgroundColor: TColorsBackgroundTertiary }}
                        />
                        <Skeleton
                            variant="rectangular"
                            width={300}
                            height={48}
                            style={{ borderRadius: '9999px', backgroundColor: TColorsBackgroundTertiary }}
                        />
                    </div>

                    {/* Grid Skeleton */}
                    <div className={styles["blogs__grid"]}>
                        {SKELETON_CARD_IDS.map((cardId) => (
                            <div key={cardId} className={styles["blogs__card"]} style={{ border: 'none' }}>
                                <Skeleton
                                    variant="rectangular"
                                    width="100%"
                                    height={200}
                                    style={{ backgroundColor: TColorsBackgroundTertiary }}
                                />
                                <div className={styles["blogs__card-content"]}>
                                    <Skeleton
                                        variant="text"
                                        width="40%"
                                        height={20}
                                        style={{ backgroundColor: TColorsBackgroundSecondary }}
                                    />
                                    <Skeleton
                                        variant="text"
                                        width="90%"
                                        height={32}
                                        style={{ backgroundColor: TColorsBackgroundTertiary }}
                                    />
                                    <Skeleton
                                        variant="text"
                                        width="100%"
                                        height={20}
                                        style={{ backgroundColor: TColorsBackgroundSecondary }}
                                    />
                                    <Skeleton
                                        variant="text"
                                        width="85%"
                                        height={20}
                                        style={{ marginBottom: TSpacing2, backgroundColor: TColorsBackgroundSecondary }}
                                    />
                                    <Skeleton
                                        variant="text"
                                        width="30%"
                                        height={24}
                                        style={{ marginTop: 'auto', backgroundColor: TColorsBackgroundTertiary }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </FluidContainer>
        </div>
    );

    if (skipBreadcrumbs) {
        return content;
    }

    return (
        <div className="page-scroll">
            {content}
        </div>
    );
}
