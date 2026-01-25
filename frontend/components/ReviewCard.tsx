"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/supabase/database.types";

interface ReviewCardProps {
  review: Review;
  index?: number;
}

export function ReviewCard({ review, index = 0 }: ReviewCardProps) {
  const displayName = review.username
    ? `@${review.username}`
    : `User ${review.telegram_user_id.slice(-4)}`;

  const formattedDate = new Date(review.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* User Info */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-sm font-semibold text-white">
            {(review.username || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-[var(--color-foreground)] text-sm">
              {displayName}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "w-4 h-4",
                star <= review.rating
                  ? "fill-[var(--color-warning)] text-[var(--color-warning)]"
                  : "text-[var(--color-muted)]"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <p className="text-[var(--color-foreground)] text-sm leading-relaxed">
        {review.content}
      </p>
    </motion.div>
  );
}

// Star Rating Input Component
interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={cn(
              "w-8 h-8 transition-colors",
              star <= value
                ? "fill-[var(--color-warning)] text-[var(--color-warning)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-warning)]"
            )}
          />
        </button>
      ))}
    </div>
  );
}
