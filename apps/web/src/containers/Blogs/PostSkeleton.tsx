import { Skeleton, Box } from "@mui/material";
import FluidContainer from "@/components/FluidContainer";
import styles from "./styles.module.scss";

export default function PostSkeleton() {
    return (
        <FluidContainer className={styles["blog-post"]}>
            <div className={styles.container}>
                <header className={styles["blog-post__header"]}>
                    <Skeleton 
                        variant="text" 
                        width="80%" 
                        height={60} 
                        sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                    />
                    <div className={styles["blog-post__meta"]}>
                        <Skeleton 
                            variant="text" 
                            width={120} 
                            height={24} 
                            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Skeleton 
                                variant="rectangular" 
                                width={60} 
                                height={24} 
                                sx={{ borderRadius: '1rem', bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                            />
                            <Skeleton 
                                variant="rectangular" 
                                width={80} 
                                height={24} 
                                sx={{ borderRadius: '1rem', bgcolor: 'rgba(255, 255, 255, 0.05)' }} 
                            />
                        </Box>
                    </div>
                </header>

                <section className={styles["blog-post__content"]}>
                    <Skeleton variant="text" width="100%" height={24} sx={{ mb: 1, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    <Skeleton variant="text" width="95%" height={24} sx={{ mb: 1, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    <Skeleton variant="text" width="98%" height={24} sx={{ mb: 3, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    
                    <Skeleton variant="rectangular" width="100%" height={300} sx={{ mb: 4, borderRadius: '1rem', bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    
                    <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                    <Skeleton variant="text" width="100%" height={24} sx={{ mb: 1, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                    <Skeleton variant="text" width="90%" height={24} sx={{ mb: 4, bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
                </section>
            </div>
        </FluidContainer>
    );
}
