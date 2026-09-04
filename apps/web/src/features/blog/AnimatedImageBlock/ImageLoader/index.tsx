import styles from './styles.module.scss';

interface ImageLoaderProps {
  isLoading: boolean;
}

export default function ImageLoader({ isLoading }: Readonly<ImageLoaderProps>) {
  const containerClassName = `${styles.shimmerContainer} ${
    !isLoading ? styles.shimmerHidden : ''
  }`;

  return (
    <div data-testid="image-loader" className={containerClassName}>
      <div className={styles.spinnerOrb}>
        <div className={styles.spinnerRing} />
        <span className={styles.spinnerIcon} aria-hidden="true">
          ✦
        </span>
      </div>
      <span className={styles.loadingLabel}>Loading illustration…</span>
    </div>
  );
}
