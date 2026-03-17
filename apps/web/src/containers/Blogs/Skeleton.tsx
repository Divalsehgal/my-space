import { Skeleton, Box } from "@mui/material";
import FluidContainer from "@/components/FluidContainer";
import styles from "./styles.module.scss";

export default function BlogsSkeleton() {
    return (
        <FluidContainer className={styles.blogs}>
            <div className={styles["blogs__container"]}>
                <div className={styles["blogs__header"]}>
                    <Skeleton variant="text" width="60%" height={80} sx={{ mx: 'auto', mb: 2 }} />
                    <Skeleton variant="text" width="40%" height={30} sx={{ mx: 'auto' }} />
                </div>

                {/* Featured Carousel Skeleton */}
                <div className={styles["blogs__section"]}>
                    <Skeleton 
                        variant="rectangular" 
                        width="100%" 
                        height={400} 
                        sx={{ borderRadius: '1.5rem', bgcolor: 'rgba(255, 255, 255, 0.03)' }} 
                    />
                </div>

                {/* All Posts Header Skeleton */}
                <div className={styles["blogs__section"]}>
                    <div className={styles["blogs__search-section"]}>
                         <Skeleton variant="text" width={150} height={40} />
                         <Skeleton variant="rectangular" width={320} height={50} sx={{ borderRadius: '0.5rem' }} />
                    </div>

                    <div className={styles["blogs__grid"]}>
                        {[...Array(6)].map((_, i) => (
                            <Box key={i} className={styles["blogs__card"]} sx={{ border: 'none' }}>
                                <Skeleton variant="rectangular" width="100%" height={200} />
                                <Box sx={{ p: '1.25rem' }}>
                                    <Skeleton variant="text" width="80%" height={30} sx={{ mb: 1 }} />
                                    <Skeleton variant="text" width="30%" height={20} sx={{ mb: 2 }} />
                                    <Skeleton variant="text" width="100%" height={20} />
                                    <Skeleton variant="text" width="90%" height={20} sx={{ mb: 2 }} />
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Skeleton variant="circular" width={60} height={24} />
                                        <Skeleton variant="circular" width={60} height={24} />
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </div>
                </div>
            </div>
        </FluidContainer>
    );
}
