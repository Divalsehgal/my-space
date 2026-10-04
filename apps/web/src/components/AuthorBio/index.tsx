import Image from "next/image";
import Link from "next/link";
import { AUTHOR } from "@/lib/config/site";
import styles from "./styles.module.scss";
import { getT } from "@/i18n/server";

export default function AuthorBio() {
  const t = getT();
  return (
    <aside className={styles["author-bio"]} aria-label={t("author.label")}>
      <Image
        src={AUTHOR.image}
        alt={AUTHOR.name}
        width={72}
        height={72}
        className={styles["author-bio__avatar"]}
      />
      <div className={styles["author-bio__content"]}>
        <p className={styles["author-bio__label"]}>{t("author.writtenBy")}</p>
        <p className={styles["author-bio__name"]}>
          <Link href="/#about" rel="author">
            {AUTHOR.name}
          </Link>
        </p>
        <p className={styles["author-bio__text"]}>{t("author.bio")}</p>
      </div>
    </aside>
  );
}
