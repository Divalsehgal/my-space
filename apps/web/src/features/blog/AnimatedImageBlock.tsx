"use client";
import { motion } from "framer-motion";
import Image from "next/image";

type AnimatedImageBlockProps = {
  asset: {
    url: string;
    title?: string;
    width?: number;
    height?: number;
  };
};

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
  return (
    <motion.figure
      style={{
        width: "100%",
        maxWidth: asset.width ? `${asset.width}px` : "100%",
        margin: "0 auto",
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Image
        loader={contentfulLoader}
        src={asset.url}
        alt={asset.title || "Blog image"}
        width={asset.width || 800}
        height={asset.height || 450}
        sizes="(max-width: 800px) 100vw, 800px"
        style={{ width: "100%", height: "auto", objectFit: "contain" }}
      />
    </motion.figure>
  );
}
