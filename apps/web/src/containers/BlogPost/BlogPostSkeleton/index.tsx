import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import FluidContainer from "@/components/FluidContainer";
import { 
  TSpacing2, 
  TSpacing3, 
  TSpacing4, 
  TSpacing6, 
  TSpacing8, 
  TSpacing12,
  TColorsBackgroundSecondary,
  TColorsBorderDefault,
} from "@dival-sehgal/design-tokens/variables.js";
import styles from "./styles.module.scss";

/**
 * Skeleton loader for the BlogPost container
 * Updated to match the doc-style sidebar layout
 */

interface BlogPostSkeletonProps {
  skipBreadcrumbs?: boolean;
}

export default function BlogPostSkeleton({ skipBreadcrumbs = false }: BlogPostSkeletonProps) {
  const content = (
    <article className={`${styles["skeleton-page"]} ${styles["blog-post"]}`}>
        <FluidContainer className={styles["blog-post__container"]}>
          <div className={styles["blog-post__layout"]}>
            {/* Sidebar Skeleton */}
            <aside className={styles["blog-post__sidebar"]}>
              <Box sx={{ py: TSpacing4 }}>
                <Skeleton
                  variant="text"
                  width={150}
                  height={24}
                  animation="wave"
                  sx={{ mb: TSpacing6, bgcolor: TColorsBackgroundSecondary }}
                />
                <Box 
                  sx={{ 
                    borderLeft: `1px solid ${TColorsBorderDefault}`, 
                    pl: TSpacing4, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: TSpacing2 
                  }}
                >
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton
                      key={i}
                      variant="text"
                      width={i % 2 === 0 ? "85%" : "65%"}
                      height={20}
                      animation="wave"
                      sx={{ bgcolor: TColorsBackgroundSecondary }}
                    />
                  ))}
                </Box>
              </Box>
            </aside>

            {/* Main Content Skeleton */}
            <main className={styles["blog-post__main"]}>
              <Box sx={{ mb: TSpacing12, mt: TSpacing8 }}>
                <Skeleton
                  variant="text"
                  width={200}
                  height={24}
                  animation="wave"
                  sx={{ bgcolor: TColorsBackgroundSecondary }}
                />
              </Box>

              <header className={styles["blog-post__header"]}>
                <Skeleton
                  variant="text"
                  width="90%"
                  height={80}
                  animation="wave"
                  sx={{ mb: TSpacing2, bgcolor: TColorsBackgroundSecondary }}
                />
                <div className={styles["blog-post__meta"]}>
                  <Skeleton
                    variant="text"
                    width={150}
                    height={28}
                    animation="wave"
                    sx={{ bgcolor: TColorsBackgroundSecondary }}
                  />
                  <Box sx={{ display: "flex", gap: TSpacing2 }}>
                    <Skeleton
                      variant="rectangular"
                      width={70}
                      height={28}
                      animation="wave"
                      sx={{
                        borderRadius: "9999px",
                        bgcolor: TColorsBackgroundSecondary,
                      }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={90}
                      height={28}
                      animation="wave"
                      sx={{
                        borderRadius: "9999px",
                        bgcolor: TColorsBackgroundSecondary,
                      }}
                    />
                  </Box>
                </div>
              </header>

              <section className={styles["blog-post__content"]}>
                <Skeleton
                  variant="text"
                  width="100%"
                  height={24}
                  animation="wave"
                  sx={{ mb: TSpacing2, bgcolor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="100%"
                  height={24}
                  animation="wave"
                  sx={{ mb: TSpacing2, bgcolor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="95%"
                  height={24}
                  animation="wave"
                  sx={{ mb: TSpacing2, bgcolor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="98%"
                  height={24}
                  animation="wave"
                  sx={{ mb: TSpacing4, bgcolor: TColorsBackgroundSecondary }}
                />

                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={400}
                  animation="wave"
                  sx={{
                    mb: TSpacing6,
                    borderRadius: TSpacing6,
                    bgcolor: TColorsBackgroundSecondary,
                  }}
                />

                <Skeleton
                  variant="text"
                  width="40%"
                  height={48}
                  animation="wave"
                  sx={{ mb: TSpacing3, bgcolor: TColorsBackgroundSecondary }}
                />

                <Skeleton
                  variant="text"
                  width="100%"
                  height={24}
                  animation="wave"
                  sx={{ mb: TSpacing2, bgcolor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="97%"
                  height={24}
                  animation="wave"
                  sx={{ mb: TSpacing2, bgcolor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="99%"
                  height={24}
                  animation="wave"
                  sx={{ mb: TSpacing2, bgcolor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="92%"
                  height={24}
                  animation="wave"
                  sx={{ mb: TSpacing4, bgcolor: TColorsBackgroundSecondary }}
                />

                <Box className={styles["blog-post__quote"]}>
                  <Skeleton
                    variant="text"
                    width="100%"
                    height={28}
                    animation="wave"
                    sx={{ mb: TSpacing2, bgcolor: TColorsBackgroundSecondary }}
                  />
                  <Skeleton
                    variant="text"
                    width="80%"
                    height={28}
                    animation="wave"
                    sx={{ bgcolor: TColorsBackgroundSecondary }}
                  />
                </Box>
              </section>
            </main>
          </div>
        </FluidContainer>
      </article>
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
