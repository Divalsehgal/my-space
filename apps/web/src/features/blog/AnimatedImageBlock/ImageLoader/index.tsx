import Spinner from '@dival-sehgal/ui/spinner';
import styles from './styles.module.scss';
import { useT } from "@/i18n/client";

interface ImageLoaderProps {
  isLoading: boolean;
}

export default function ImageLoader({ isLoading }: Readonly<ImageLoaderProps>) {
  const t = useT();
  const containerClassName = `${styles.shimmerContainer} ${
    !isLoading ? styles.shimmerHidden : ''
  }`;

  return (
    <div data-testid="image-loader" className={containerClassName}>
      <div className={styles.spinnerOrb}>
        <Spinner size={44} className={styles.spinnerRing} aria-label={t("image.loading")} />
        <span className={styles.spinnerIcon} aria-hidden="true">
          ✦
        </span>
      </div>
      <span className={styles.loadingLabel}>{t("image.loadingVisible")}</span>
    </div>
  );
}
