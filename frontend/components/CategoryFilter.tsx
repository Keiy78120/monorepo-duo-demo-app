"use client";

import { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/lib/store/telegram";

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { selection } = useHapticFeedback();

  // Scroll selected category into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const selectedEl = container.querySelector(`[data-category="${selected}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selected]);

  const handleSelect = (category: string) => {
    selection();
    onChange(category);
  };

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto scrollbar-hide px-5 -mx-5 py-2"
    >
      {categories.map((category) => {
        const isSelected = category === selected;

        return (
          <button
            key={category}
            data-category={category}
            onClick={() => handleSelect(category)}
            className={cn(
              "relative px-5 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300",
              isSelected
                ? "text-[var(--color-primary-foreground)]"
                : "text-[var(--color-foreground)] hover:text-[var(--color-foreground)] glass-pill"
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="categoryPill"
                className="absolute inset-0 bg-[var(--color-primary)] rounded-full shadow-[0_4px_12px_oklch(0.55_0.15_250_/_0.3)]"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{category}</span>
          </button>
        );
      })}
    </div>
  );
}
