import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import FluidContainer from "@/components/FluidContainer";
import {
    TSpacing2,
    TSpacing4,
    TSpacingFull,
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
                            animation="wave"
                            sx={{ mx: 'auto', mb: TSpacing2, bgcolor: TColorsBackgroundTertiary }}
                        />
                        <Skeleton
                            variant="text"
                            width="30%"
                            height={24}
                            animation="wave"
                            sx={{ mx: 'auto', bgcolor: TColorsBackgroundTertiary }}
                        />
                    </div>

                    {/* Featured Carousel Skeleton */}
                    <Box sx={{ mb: TSpacing4 }}>
                        <Skeleton
                            variant="rectangular"
                            width={TSpacingFull}
                            height={450}
                            animation="wave"
                            sx={{
                                borderRadius: '2rem',
                                bgcolor: TColorsBackgroundTertiary,
                                border: `1px solid ${TColorsBorderDefault}`
                            }}
                        />
                    </Box>

                    {/* Search Section Skeleton */}
                    <div className={styles["blogs__search-container"]}>
                        <Skeleton
                            variant="text"
                            width={120}
                            height={40}
                            animation="wave"
                            sx={{ bgcolor: TColorsBackgroundTertiary }}
                        />
                        <Skeleton
                            variant="rectangular"
                            width={300}
                            height={48}
                            animation="wave"
                            sx={{ borderRadius: '9999px', bgcolor: TColorsBackgroundTertiary }}
                        />
                    </div>

                    {/* Grid Skeleton */}
                    <div className={styles["blogs__grid"]}>
                        {SKELETON_CARD_IDS.map((cardId) => (
                            <Box key={cardId} className={styles["blogs__card"]} sx={{ border: 'none' }}>
                                <Skeleton
                                    variant="rectangular"
                                    width="100%"
                                    height={200}
                                    animation="wave"
                                    sx={{ bgcolor: TColorsBackgroundTertiary }}
                                />
                                <Box className={styles["blogs__card-content"]}>
                                    <Skeleton
                                        variant="text"
                                        width="40%"
                                        height={20}
                                        animation="wave"
                                        sx={{ bgcolor: TColorsBackgroundSecondary }}
                                    />
                                    <Skeleton
                                        variant="text"
                                        width="90%"
                                        height={32}
                                        animation="wave"
                                        sx={{ bgcolor: TColorsBackgroundTertiary }}
                                    />
                                    <Skeleton
                                        variant="text"
                                        width="100%"
                                        height={20}
                                        animation="wave"
                                        sx={{ bgcolor: TColorsBackgroundSecondary }}
                                    />
                                    <Skeleton
                                        variant="text"
                                        width="85%"
                                        height={20}
                                        animation="wave"
                                        sx={{ mb: TSpacing2, bgcolor: TColorsBackgroundSecondary }}
                                    />
                                    <Skeleton
                                        variant="text"
                                        width="30%"
                                        height={24}
                                        animation="wave"
                                        sx={{ mt: 'auto', bgcolor: TColorsBackgroundTertiary }}
                                    />
                                </Box>
                            </Box>
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
