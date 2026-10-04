import Skeleton from "@dival-sehgal/ui/skeleton";
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

const SKELETON_LINE_COUNT = 6;
const SKELETON_LINES = Array.from({ length: SKELETON_LINE_COUNT }, (_, i) => i + 1);

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
              <div style={{ paddingBlock: TSpacing4 }}>
                <Skeleton
                  variant="text"
                  width={150}
                  height={24}
                  style={{ marginBottom: TSpacing6, backgroundColor: TColorsBackgroundSecondary }}
                />
                <div 
                  style={{ 
                    borderLeft: `1px solid ${TColorsBorderDefault}`, 
                    paddingLeft: TSpacing4,
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: TSpacing2 
                  }}
                >
                  {SKELETON_LINES.map((i) => (
                    <Skeleton
                      key={i}
                      variant="text"
                      width={i % 2 === 0 ? "85%" : "65%"}
                      height={20}
                      style={{ backgroundColor: TColorsBackgroundSecondary }}
                    />
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content Skeleton */}
            <div className={styles["blog-post__main"]}>
              <div style={{ marginBottom: TSpacing12, marginTop: TSpacing8 }}>
                <Skeleton
                  variant="text"
                  width={200}
                  height={24}
                  style={{ backgroundColor: TColorsBackgroundSecondary }}
                />
              </div>

              <header className={styles["blog-post__header"]}>
                <Skeleton
                  variant="text"
                  width="90%"
                  height={80}
                  style={{ marginBottom: TSpacing2, backgroundColor: TColorsBackgroundSecondary }}
                />
                <div className={styles["blog-post__meta"]}>
                  <Skeleton
                    variant="text"
                    width={150}
                    height={28}
                    style={{ backgroundColor: TColorsBackgroundSecondary }}
                  />
                  <div style={{ display: "flex", gap: TSpacing2 }}>
                    <Skeleton
                      variant="rectangular"
                      width={70}
                      height={28}
                      style={{
                        borderRadius: "9999px",
                        backgroundColor: TColorsBackgroundSecondary,
                      }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={90}
                      height={28}
                      style={{
                        borderRadius: "9999px",
                        backgroundColor: TColorsBackgroundSecondary,
                      }}
                    />
                  </div>
                </div>
              </header>

              <section className={styles["blog-post__content"]}>
                <Skeleton
                  variant="text"
                  width="100%"
                  height={24}
                  style={{ marginBottom: TSpacing2, backgroundColor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="100%"
                  height={24}
                  style={{ marginBottom: TSpacing2, backgroundColor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="95%"
                  height={24}
                  style={{ marginBottom: TSpacing2, backgroundColor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="98%"
                  height={24}
                  style={{ marginBottom: TSpacing4, backgroundColor: TColorsBackgroundSecondary }}
                />

                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={400}
                  style={{
                    marginBottom: TSpacing6,
                    borderRadius: TSpacing6,
                    backgroundColor: TColorsBackgroundSecondary,
                  }}
                />

                <Skeleton
                  variant="text"
                  width="40%"
                  height={48}
                  style={{ marginBottom: TSpacing3, backgroundColor: TColorsBackgroundSecondary }}
                />

                <Skeleton
                  variant="text"
                  width="100%"
                  height={24}
                  style={{ marginBottom: TSpacing2, backgroundColor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="97%"
                  height={24}
                  style={{ marginBottom: TSpacing2, backgroundColor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="99%"
                  height={24}
                  style={{ marginBottom: TSpacing2, backgroundColor: TColorsBackgroundSecondary }}
                />
                <Skeleton
                  variant="text"
                  width="92%"
                  height={24}
                  style={{ marginBottom: TSpacing4, backgroundColor: TColorsBackgroundSecondary }}
                />

                <div className={styles["blog-post__quote"]}>
                  <Skeleton
                    variant="text"
                    width="100%"
                    height={28}
                    style={{ marginBottom: TSpacing2, backgroundColor: TColorsBackgroundSecondary }}
                  />
                  <Skeleton
                    variant="text"
                    width="80%"
                    height={28}
                    style={{ backgroundColor: TColorsBackgroundSecondary }}
                  />
                </div>
              </section>
            </div>
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
