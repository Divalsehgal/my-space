import { motion } from 'framer-motion';
import Image, { ImageLoader } from 'next/image';
import IconButton from '@dival-sehgal/ui/icon-button';
import styles from './styles.module.scss';
import { useT } from "@/i18n/client";

/** 16:9 size used when Contentful doesn't report the image's dimensions. */
const FALLBACK_SIZE = { width: 1200, height: 675 } as const;

interface ImageLightboxProps {
  isOpen: boolean;
  asset: {
    url: string;
    title?: string;
    width?: number;
    height?: number;
  };
  loader?: ImageLoader;
  onClose: () => void;
}

export default function ImageLightbox({
  isOpen,
  asset,
  loader,
  onClose,
}: Readonly<ImageLightboxProps>) {
  const t = useT();
  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
      className={styles.lightboxOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={asset.title || t("image.expandedView")}
    >
      <motion.div
        className={styles.lightboxContent}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton className={styles.lightboxClose} onClick={onClose} aria-label={t("image.closeFull")}>
          <span aria-hidden="true">✕</span>
        </IconButton>

        <Image
          loader={loader}
          src={asset.url}
          alt={asset.title || t("image.expandedAlt")}
          width={asset.width || FALLBACK_SIZE.width}
          height={asset.height || FALLBACK_SIZE.height}
          className={styles.lightboxImage}
          priority
        />

        {asset.title && (
          <p className={styles.lightboxCaption}>{asset.title}</p>
        )}
      </motion.div>
    </motion.div>
  );
}
