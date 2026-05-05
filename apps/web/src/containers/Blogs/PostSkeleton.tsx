import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";

import FluidContainer from "@/components/FluidContainer";
import styles from "./styles.module.scss";

export default function PostSkeleton() {
    return (
        <article className={styles["blog-post"]}>
            <FluidContainer className={styles["blog-post__container"]}>

                {/* Breadcrumbs Skeleton */}
                <Box sx={{ mb: 6, mt: 4 }}>
                    <Skeleton 
                        variant="text" 
                        width={200} 
                        height={24} 
                        animation="wave"
                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                    />
                </Box>

                <header className={styles["blog-post__header"]} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Skeleton 
                        variant="text" 
                        width="90%" 
                        height={80} 
                        animation="wave"
                        sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.08)' }} 
                    />
                    <div className={styles["blog-post__meta"]}>
                        <Skeleton 
                            variant="text" 
                            width={150} 
                            height={28} 
                            animation="wave"
                            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                        />
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Skeleton 
                                variant="rectangular" 
                                width={70} 
                                height={28} 
                                animation="wave"
                                sx={{ borderRadius: '9999px', bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                            />
                            <Skeleton 
                                variant="rectangular" 
                                width={90} 
                                height={28} 
                                animation="wave"
                                sx={{ borderRadius: '9999px', bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                            />
                        </Box>
                    </div>
                </header>

                <section className={styles["blog-post__content"]} style={{ paddingBottom: '4rem' }}>
                    {/* Intro paragraph */}
                    <Skeleton variant="text" width="100%" height={24} animation="wave" sx={{ mb: 1, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    <Skeleton variant="text" width="100%" height={24} animation="wave" sx={{ mb: 1, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    <Skeleton variant="text" width="95%" height={24} animation="wave" sx={{ mb: 1, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    <Skeleton variant="text" width="98%" height={24} animation="wave" sx={{ mb: 4, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    
                    {/* Image Placeholder */}
                    <Skeleton 
                        variant="rectangular" 
                        width="100%" 
                        height={400} 
                        animation="wave"
                        sx={{ mb: 6, borderRadius: '1.5rem', bgcolor: 'rgba(255, 255, 255, 0.02)' }} 
                    />
                    
                    {/* Subheading */}
                    <Skeleton variant="text" width="40%" height={48} animation="wave" sx={{ mb: 3, bgcolor: 'rgba(255, 255, 255, 0.06)' }} />
                    
                    {/* More text */}
                    <Skeleton variant="text" width="100%" height={24} animation="wave" sx={{ mb: 1, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    <Skeleton variant="text" width="97%" height={24} animation="wave" sx={{ mb: 1, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    <Skeleton variant="text" width="99%" height={24} animation="wave" sx={{ mb: 1, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    <Skeleton variant="text" width="92%" height={24} animation="wave" sx={{ mb: 4, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />

                    {/* Blockquote Placeholder */}
                    <Box sx={{ borderLeft: '4px solid rgba(255, 255, 255, 0.1)', pl: 4, my: 6, py: 1 }}>
                        <Skeleton variant="text" width="100%" height={28} animation="wave" sx={{ mb: 1, fontStyle: 'italic', bgcolor: 'rgba(255, 255, 255, 0.04)' }} />
                        <Skeleton variant="text" width="80%" height={28} animation="wave" sx={{ fontStyle: 'italic', bgcolor: 'rgba(255, 255, 255, 0.04)' }} />
                    </Box>
                </section>
            </FluidContainer>
        </article>
    );
}



