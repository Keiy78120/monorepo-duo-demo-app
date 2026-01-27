"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageZoomModalProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageZoomModal({
  src,
  alt,
  open,
  onOpenChange,
}: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const touchStartDistance = useRef<number>(0);
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  // Handle pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistance.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1 && scale > 1) {
      // Single touch for panning when zoomed
      lastTouchPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (touchStartDistance.current > 0) {
        const newScale = scale * (distance / touchStartDistance.current);
        setScale(Math.min(Math.max(1, newScale), 4)); // Min 1x, Max 4x
        touchStartDistance.current = distance;
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1 && lastTouchPos.current) {
      // Pan when zoomed
      const deltaX = e.touches[0].clientX - lastTouchPos.current.x;
      const deltaY = e.touches[0].clientY - lastTouchPos.current.y;

      setPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      lastTouchPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = () => {
    touchStartDistance.current = 0;
    lastTouchPos.current = null;
    setIsDragging(false);
  };

  // Double tap to zoom
  const lastTapTime = useRef(0);
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      if (scale === 1) {
        setScale(2.5);
      } else {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    }

    lastTapTime.current = now;
  };

  // Zoom buttons
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 max-w-full w-screen h-screen border-0 bg-black/95"
        style={{ maxHeight: "100vh" }}
      >
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Fermer</span>
        </button>

        {/* Zoom Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className={cn(
              "p-2 rounded-full transition-colors",
              scale <= 1
                ? "text-white/30 cursor-not-allowed"
                : "text-white hover:bg-white/20"
            )}
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm font-medium min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className={cn(
              "p-2 rounded-full transition-colors",
              scale >= 4
                ? "text-white/30 cursor-not-allowed"
                : "text-white hover:bg-white/20"
            )}
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* Image Container */}
        <div
          ref={imageRef}
          className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleDoubleTap}
        >
          <motion.div
            className="relative w-full h-full flex items-center justify-center"
            animate={{
              scale,
              x: position.x,
              y: position.y,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ touchAction: "none" }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              quality={100}
              draggable={false}
            />
          </motion.div>
        </div>

        {/* Hint */}
        {scale === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
              Double-tap ou pinch pour zoomer
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
