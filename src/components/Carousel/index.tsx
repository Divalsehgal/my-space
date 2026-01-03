"use client";

import React, { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import styles from "./styles.module.scss";
import SectionHeader from "../SectionHeader";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type CarouselProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode[] | React.ReactNode;
};

export default function Carousel({
  title,
  subtitle,
  children,
}: Readonly<CarouselProps>) {
  const items = React.Children.toArray(children);
  const [activeIndex, setActiveIndex] = useState(0);

  const isMobile = useMediaQuery(`(max-width: ${768}px)`);
  const carouselBtnSize = isMobile
    ? {
        btn: "small" as const,
        icon: "small" as const,
      }
    : {
        btn: "medium" as const,
        icon: "medium" as const,
      };

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;

  const handlePrev = () => {
    if (!canPrev) return;
    setActiveIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (!canNext) return;
    setActiveIndex((i) => i + 1);
  };

  // --- Swipe state ---
  const [startX, setStartX] = useState<number | null>(null);
  const [deltaX, setDeltaX] = useState(0);
  const SWIPE_THRESHOLD = 2; // px

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (e.touches.length !== 1) return;
    setStartX(e.touches[0].clientX);
    setDeltaX(0);
  };

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (startX === null) return;
    const currentX = e.touches[0].clientX;
    setDeltaX(currentX - startX);
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0 && canPrev) {
        // swipe right → previous slide
        handlePrev();
      } else if (deltaX < 0 && canNext) {
        // swipe left → next slide
        handleNext();
      }
    }
    setStartX(null);
    setDeltaX(0);
  };

  return (
    <Box className={styles.carousel}>
      {(title || subtitle) && (
        <SectionHeader
          title={title}
          subtitle={subtitle}
          align="left"
          className={styles["carousel__header"]}
        />
      )}

      <div
        className={styles["carousel__viewport"]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={styles["carousel__track"]}
          style={{
            transform: `translateX(-${activeIndex * 100}%)`,
            // optional: you could add "transition" in CSS for smooth slide
          }}
        >
          {items.map((item, index) => (
            <div key={index} className={styles["carousel__slide"]}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className={styles["carousel__controls"]}>
        <IconButton
          className={styles["carousel__control-button"]}
          onClick={handlePrev}
          disabled={!canPrev}
          aria-label="Previous"
          size={carouselBtnSize.btn}
        >
          <ChevronLeft fontSize={carouselBtnSize.icon} />
        </IconButton>

        <div className={styles["carousel__dots"]}>
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`${styles["carousel__dot"]} ${
                index === activeIndex ? styles["carousel__dot--active"] : ""
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <IconButton
          className={styles["carousel__control-button"]}
          onClick={handleNext}
          disabled={!canNext}
          aria-label="Next"
          size={carouselBtnSize.btn}
        >
          <ChevronRight fontSize={carouselBtnSize.icon} />
        </IconButton>
      </div>
    </Box>
  );
}
