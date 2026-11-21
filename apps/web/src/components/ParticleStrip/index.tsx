import ParticlesBackground from "@/components/ParticlesBackground";
import styles from "./styles.module.scss";

/** Decorative particle layer for the homepage top bar and blog breadcrumbs; the parent must be position: relative/absolute with overflow hidden. */
export default function ParticleStrip({ id }: Readonly<{ id: string }>) {
  return (
    <div className={styles["particle-strip"]} aria-hidden="true">
      <ParticlesBackground id={id} className={styles["particle-strip__canvas"]} fullScreen={false} count={1000} />
    </div>
  );
}
