"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ImageLoader from "./ImageLoader";
import ImageLightbox from "./ImageLightbox";
import styles from "./styles.module.scss";
import { useT } from "@/i18n/client";
import { contentfulImageLoader } from "@/lib/contentful/imageLoader";

/** 16:9 size used when Contentful doesn't report the image's dimensions. */
const FALLBACK_SIZE = { width: 800, height: 450 } as const;

export interface AnimatedImageBlockProps {
  asset: {
    url: string;
    title?: string;
    width?: number;
    height?: number;
  };
}


export function AnimatedImageBlock({ asset }: Readonly<AnimatedImageBlockProps>) {
  const t = useT();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const loaderStrategy = process.env.NEXT_PUBLIC_IMAGE_LOADER;
  const loaderToUse = loaderStrategy === "default" ? undefined : contentfulImageLoader;

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
        <button
          type="button"
          className={styles.imageWrapper}
          style={{ aspectRatio }}
          onClick={handleTriggerClick}
          aria-label={
            asset.title ? t("image.viewFullNamed", { title: asset.title }) : t("image.viewFull")
          }
        >
          {/* Interactive Separated Shimmer Loader */}
          <ImageLoader isLoading={isLoading} />

          <Image
            loader={loaderToUse}
            src={hasError ? "/placeholder-project.jpg" : asset.url}
            alt={asset.title || t("image.fallbackAlt")}
            width={asset.width || FALLBACK_SIZE.width}
            height={asset.height || FALLBACK_SIZE.height}
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
              <span>{t("image.expandHint")}</span>
            </div>
          )}
        </button>

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
