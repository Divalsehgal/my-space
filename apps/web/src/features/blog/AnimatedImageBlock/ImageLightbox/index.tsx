import { motion } from 'framer-motion';
import Image, { ImageLoader } from 'next/image';
import styles from './styles.module.scss';

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
      aria-label={asset.title || 'Expanded image view'}
    >
      <motion.div
        className={styles.lightboxContent}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.lightboxClose}
          onClick={onClose}
          aria-label="Close full view"
        >
          ✕
        </button>

        <Image
          loader={loader}
          src={asset.url}
          alt={asset.title || 'Blog illustration expanded'}
          width={asset.width || 1200}
          height={asset.height || 675}
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
