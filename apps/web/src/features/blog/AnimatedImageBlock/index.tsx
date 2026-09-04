"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ImageLoader from "./ImageLoader";
import ImageLightbox from "./ImageLightbox";
import styles from "./styles.module.scss";

export interface AnimatedImageBlockProps {
  asset: {
    url: string;
    title?: string;
    width?: number;
    height?: number;
  };
}

const contentfulLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  const secureSrc = src.startsWith("//") ? `https:${src}` : src;
  return `${secureSrc}?w=${width}&q=${quality || 75}`;
};

export function AnimatedImageBlock({ asset }: Readonly<AnimatedImageBlockProps>) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const loaderStrategy = process.env.NEXT_PUBLIC_IMAGE_LOADER;
  const loaderToUse = loaderStrategy === "default" ? undefined : contentfulLoader;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsLightboxOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isLightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen, handleKeyDown]);

  const handleTriggerClick = () => {
    if (!hasError) {
      setIsLightboxOpen(true);
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTriggerClick();
    }
  };

  const aspectRatio =
    asset.width && asset.height
      ? `${asset.width} / ${asset.height}`
      : "16 / 9";

  const imageClassName = `${styles.imageElement} ${
    isLoading ? styles.imageLoading : styles.imageLoaded
  }`;

  return (
    <>
      <motion.figure
        className={styles.figure}
        style={{
          maxWidth: asset.width ? `${asset.width}px` : "100%",
        }}
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div
          className={styles.imageWrapper}
          style={{ aspectRatio }}
          onClick={handleTriggerClick}
          role="button"
          tabIndex={0}
          onKeyDown={handleTriggerKeyDown}
          aria-label={
            asset.title
              ? `View ${asset.title} in full screen`
              : "View image in full screen"
          }
        >
          {/* Interactive Separated Shimmer Loader */}
          <ImageLoader isLoading={isLoading} />

          <Image
            loader={loaderToUse}
            src={hasError ? "/placeholder-project.jpg" : asset.url}
            alt={asset.title || "Blog illustration"}
            width={asset.width || 800}
            height={asset.height || 450}
            sizes="(max-width: 800px) 100vw, 800px"
            className={imageClassName}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />

          {!isLoading && !hasError && (
            <div className={styles.zoomHint} aria-hidden="true">
              <span>🔍</span>
              <span>Click to expand</span>
            </div>
          )}
        </div>

        {asset.title && (
          <figcaption className={styles.caption}>{asset.title}</figcaption>
        )}
      </motion.figure>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        <ImageLightbox
          isOpen={isLightboxOpen}
          asset={asset}
          loader={loaderToUse}
          onClose={() => setIsLightboxOpen(false)}
        />
      </AnimatePresence>
    </>
  );
}

export default AnimatedImageBlock;
