"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "motion/react";
import { cn } from "@/lib/utils";
import { ImageZoomModal } from "./image-zoom-modal";
import { ZoomIn } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "portrait";
  showPagination?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  enableZoom?: boolean;
}

function isVideo(url: string): boolean {
  if (!url) return false;
  const extensions = [".mp4", ".webm", ".mov", ".m4v"];
  const cleanUrl = url.split("?")[0].toLowerCase();
  return extensions.some((ext) => cleanUrl.endsWith(ext));
}

export function ImageCarousel({
  images,
  alt = "Image",
  className,
  aspectRatio = "square",
  showPagination = true,
  autoPlay = false,
  autoPlayInterval = 4000,
  enableZoom = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);
  const [showZoomModal, setShowZoomModal] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDraggingRef = React.useRef(false);

  const validImages = React.useMemo(() => {
    const filtered = images.filter((img) => img && img.trim() !== "");
    return filtered.length > 0 ? filtered : ["/placeholder.png"];
  }, [images]);

  const hasMultiple = validImages.length > 1;

  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay || !hasMultiple) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, hasMultiple, validImages.length]);

  // Handle swipe
  const handleDragStart = () => {
    isDraggingRef.current = false;
  };

  const handleDrag = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset < -threshold || velocity < -500) {
      // Swipe left -> next
      if (currentIndex < validImages.length - 1) {
        setDirection(1);
        setCurrentIndex((prev) => prev + 1);
      }
    } else if (offset > threshold || velocity > 500) {
      // Swipe right -> prev
      if (currentIndex > 0) {
        setDirection(-1);
        setCurrentIndex((prev) => prev - 1);
      }
    }
  };

  // Handle image tap to zoom
  const handleImageClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Only open zoom if not dragging and zoom is enabled and not a video
    if (!isDraggingRef.current && enableZoom && !isCurrentVideo) {
      e.preventDefault();
      e.stopPropagation();
      setShowZoomModal(true);
    }
    isDraggingRef.current = false;
  };

  const goToIndex = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const aspectClass = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
  }[aspectRatio];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  const currentImage = validImages[currentIndex];
  const isCurrentVideo = isVideo(currentImage);

  return (
    <>
      <div className={cn("relative overflow-hidden", aspectClass, className)} ref={containerRef}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag={hasMultiple ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onClick={handleImageClick}
            onTouchEnd={(e) => {
              // Delay to allow drag detection
              setTimeout(() => {
                if (!isDraggingRef.current) {
                  handleImageClick(e as any);
                }
              }, 50);
            }}
            className={cn(
              "absolute inset-0",
              hasMultiple ? "cursor-grab active:cursor-grabbing" : enableZoom && !isCurrentVideo ? "cursor-zoom-in" : ""
            )}
          >
            {isCurrentVideo ? (
              <video
                src={currentImage}
                className="h-full w-full object-cover"
                muted
                playsInline
                loop
                autoPlay
                preload="metadata"
              />
            ) : (
              <Image
                src={currentImage}
                alt={`${alt} ${currentIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={currentIndex === 0}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Zoom hint icon */}
        {enableZoom && !isCurrentVideo && !hasMultiple && (
          <div className="absolute top-3 left-3 z-10 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm pointer-events-none">
            <ZoomIn className="w-4 h-4" />
          </div>
        )}

      {/* Pagination dots */}
      {showPagination && hasMultiple && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "w-6 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/70"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image counter */}
      {hasMultiple && (
        <div className="absolute top-3 right-3 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {validImages.length}
        </div>
      )}
      </div>

      {/* Zoom Modal */}
      {enableZoom && !isCurrentVideo && (
        <ImageZoomModal
          src={currentImage}
          alt={`${alt} ${currentIndex + 1}`}
          open={showZoomModal}
          onOpenChange={setShowZoomModal}
        />
      )}
    </>
  );
}
