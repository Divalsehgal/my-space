"use client";

import { useState, useEffect, useCallback } from "react";
import IconButton from "@mui/material/IconButton";

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import clsx from "clsx";
import styles from "./styles.module.scss";

type CarouselProps<T> = {
  items: ReadonlyArray<T>;
  sectionTitle?: string;
  progressLabelPrefix?: string;
  renderItem: (item: T) => React.ReactNode;
  showNavigation?: boolean;
  showProgress?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
};

export default function Carousel<T>({
  items,
  sectionTitle,
  progressLabelPrefix = "Item",
  renderItem,
  showNavigation = true,
  showProgress = true,
  showDots = false,
  autoPlay = false,
  autoPlayInterval = 5000,
}: Readonly<CarouselProps<T>>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAutoPlayActive, setIsAutoPlayActive] = useState(autoPlay);

  const minSwipeDistance = 50;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    const t = e.targetTouches && e.targetTouches[0];
    if (t) {setTouchStart(t.clientX);}
    setIsAutoPlayActive(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.targetTouches && e.targetTouches[0];
    if (t) {setTouchEnd(t.clientX);}
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {return;}
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  useEffect(() => {
    if (!isAutoPlayActive || items.length <= 1) {return;}

    const interval = window.setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => window.clearInterval(interval);
  }, [isAutoPlayActive, autoPlayInterval, handleNext, items.length]);

  if (!items || items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];
  // Calculate progress percentage: (currentIndex + 1) / total * 100
  const progressPercentage = ((currentIndex + 1) / items.length) * 100;

  return (
    <div className={styles.carousel}>
      {/* Unified Control Bar (Progress + Navigation) */}
      <div className={styles["carousel__header"]}>
        {sectionTitle && (
          <h2 className={styles["carousel__section-title"]}>{sectionTitle}</h2>
        )}
        {showProgress && (
          <div className={styles["carousel__progress"]}>
            <div className={styles["carousel__progress-header"]}>
              <span className={styles["carousel__progress-label"]}>
                {progressLabelPrefix} {currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1} / {items.length < 10 ? `0${items.length}` : items.length}
              </span>
            </div>
            <div className={styles["carousel__progress-track"]}>
              <div
                className={styles["carousel__progress-indicator"]}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {showNavigation && (
          <div className={styles["carousel__nav"]}>
            <IconButton
              className={clsx(styles["carousel__nav-btn"], styles["carousel__nav-btn--prev"])}
              onClick={() => {
                handlePrev();
                setIsAutoPlayActive(false);
              }}
              aria-label="Previous"
              size="small"
            >
              <ChevronLeftIcon className={styles["carousel__nav-icon"]} />
            </IconButton>
            <IconButton
              className={clsx(styles["carousel__nav-btn"], styles["carousel__nav-btn--next"])}
              onClick={() => {
                handleNext();
                setIsAutoPlayActive(false);
              }}
              aria-label="Next"
              size="small"
            >
              <ChevronRightIcon className={styles["carousel__nav-icon"]} />
            </IconButton>
          </div>
        )}
      </div>

      {/* Carousel Main Content */}
      <section
        className={styles["carousel__content"]}
        data-testid="carousel-content"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >

        {/* Main Item Render (Card Container) */}
        <div className={styles["carousel__item-wrapper"]}>
          {renderItem(currentItem)}
        </div>

        {showDots && (
          <div className={styles["carousel__dots"]}>
            {items.map((_, index) => (
              <button
                key={index}
                className={clsx(styles["carousel__dot"], { [styles["carousel__dot--active"]]: currentIndex === index })}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsAutoPlayActive(false);
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
