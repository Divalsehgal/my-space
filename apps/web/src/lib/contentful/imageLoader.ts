import type { ImageLoaderProps } from "next/image";

/** Contentful Images API quality when next/image doesn't pass one. */
const DEFAULT_QUALITY = 75;

/** next/image loader for Contentful's Images API: resized, WebP, protocol-relative URLs made https. */
export function contentfulImageLoader({ src, width, quality }: ImageLoaderProps): string {
  const secureSrc = src.startsWith("//") ? `https:${src}` : src;
  return `${secureSrc}?w=${width}&q=${quality || DEFAULT_QUALITY}&fm=webp`;
}
