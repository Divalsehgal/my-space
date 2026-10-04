import Link from "next/link";
import type { ContentfulPost } from "@/types";
import styles from "./styles.module.scss";
import { getT } from "@/i18n/server";
import { AUTHOR } from "@/lib/config/site";

type RelatedPostsProps = {
  posts: readonly ContentfulPost[];
};

export default function RelatedPosts({ posts }: Readonly<RelatedPostsProps>) {
  const t = getT();
  if (posts.length === 0) {
    return null;
  }

  return (
    <nav className={styles["related-posts"]} aria-labelledby="related-posts-heading">
      <h2 id="related-posts-heading" className={styles["related-posts__heading"]}>
        {t("post.related", { name: AUTHOR.name })}
      </h2>
      <ul className={styles["related-posts__list"]}>
        {posts.map((post) => (
          <li key={post.slug} className={styles["related-posts__item"]}>
            <Link href={`/blogs/${post.slug}`} className={styles["related-posts__link"]}>
              {post.title}
            </Link>
            {post.description && <p className={styles["related-posts__description"]}>{post.description}</p>}
          </li>
        ))}
      </ul>
    </nav>
  );
}
