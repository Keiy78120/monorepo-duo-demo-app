"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
}

/**
 * ScrollReveal Component
 *
 * Reveals elements with smooth animations as they enter the viewport.
 * Perfect for product cards, sections, and list items.
 *
 * @param children - Content to reveal
 * @param delay - Animation delay in seconds (default: 0)
 * @param className - Additional CSS classes
 * @param direction - Animation direction (default: "up")
 * @param distance - Animation distance in pixels (default: 20)
 */
export function ScrollReveal({
  children,
  delay = 0,
  className,
  direction = "up",
  distance = 20,
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true, // Animate only once
    amount: 0.3, // Trigger when 30% visible
  });

  // Calculate initial position based on direction
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { x: 0, y: distance };
      case "down":
        return { x: 0, y: -distance };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      default:
        return { x: 0, y: distance };
    }
  };

  const initial = {
    opacity: 0,
    ...getInitialPosition(),
  };

  const animate = isInView
    ? { opacity: 1, x: 0, y: 0 }
    : { opacity: 0, ...getInitialPosition() };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={animate}
      transition={{
        delay,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1], // Smooth easing curve
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScrollRevealStaggered Component
 *
 * Reveals a list of children with staggered delays.
 * Perfect for product grids and lists.
 */
interface ScrollRevealStaggeredProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}

export function ScrollRevealStaggered({
  children,
  staggerDelay = 0.05,
  className,
  direction = "up",
}: ScrollRevealStaggeredProps) {
  return (
    <>
      {children.map((child, index) => (
        <ScrollReveal
          key={index}
          delay={index * staggerDelay}
          className={className}
          direction={direction}
        >
          {child}
        </ScrollReveal>
      ))}
    </>
  );
}
