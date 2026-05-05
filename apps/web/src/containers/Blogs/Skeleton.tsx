import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";

import FluidContainer from "@/components/FluidContainer";
import styles from "./styles.module.scss";

export default function BlogsSkeleton() {
    return (
        <div className={styles.blogs}>
            <FluidContainer>
                <div className={styles["blogs__container"]}>

                <div className={styles["blogs__header"]}>
                    <Skeleton 
                        variant="text" 
                        width="40%" 
                        height={64} 
                        animation="wave"
                        sx={{ mx: 'auto', mb: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                    />
                    <Skeleton 
                        variant="text" 
                        width="30%" 
                        height={24} 
                        animation="wave"
                        sx={{ mx: 'auto', bgcolor: 'rgba(255, 255, 255, 0.03)' }} 
                    />
                </div>

                {/* Featured Carousel Skeleton */}
                <div style={{ marginBottom: '4rem' }}>
                    <Skeleton 
                        variant="rectangular" 
                        width="100%" 
                        height={450} 
                        animation="wave"
                        sx={{ 
                            borderRadius: '2rem', 
                            bgcolor: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }} 
                    />
                </div>

                {/* Search Section Skeleton */}
                <div className={styles["blogs__search-container"]}>
                    <Skeleton 
                        variant="text" 
                        width={120} 
                        height={40} 
                        animation="wave"
                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                    />
                    <Skeleton 
                        variant="rectangular" 
                        width={300} 
                        height={48} 
                        animation="wave"
                        sx={{ borderRadius: '9999px', bgcolor: 'rgba(255, 255, 255, 0.03)' }} 
                    />
                </div>

                {/* Grid Skeleton */}
                <div className={styles["blogs__grid"]}>
                    {[...Array(6)].map((_, i) => (
                        <Box key={i} className={styles["blogs__card"]} sx={{ border: 'none', background: 'rgba(255, 255, 255, 0.01)' }}>
                            <Skeleton 
                                variant="rectangular" 
                                width="100%" 
                                height={200} 
                                animation="wave"
                                sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)' }} 
                            />
                            <Box sx={{ p: '1.5rem', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Skeleton 
                                    variant="text" 
                                    width="40%" 
                                    height={20} 
                                    animation="wave"
                                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }} 
                                />
                                <Skeleton 
                                    variant="text" 
                                    width="90%" 
                                    height={32} 
                                    animation="wave"
                                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                                />
                                <Skeleton 
                                    variant="text" 
                                    width="100%" 
                                    height={20} 
                                    animation="wave"
                                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }} 
                                />
                                <Skeleton 
                                    variant="text" 
                                    width="85%" 
                                    height={20} 
                                    animation="wave"
                                    sx={{ mb: 1, bgcolor: 'rgba(255, 255, 255, 0.02)' }} 
                                />
                                <Skeleton 
                                    variant="text" 
                                    width="30%" 
                                    height={24} 
                                    animation="wave"
                                    sx={{ mt: 'auto', bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                                />
                            </Box>
                        </Box>
                    ))}
                </div>
                </div>
            </FluidContainer>
        </div>
    );
}


