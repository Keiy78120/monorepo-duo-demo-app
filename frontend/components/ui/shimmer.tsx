import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
  variant?: "default" | "card" | "text" | "circle";
}

/**
 * Shimmer Component
 *
 * Animated loading placeholder with gradient shimmer effect.
 * Better than static skeletons for perceived performance.
 *
 * @param className - Additional CSS classes
 * @param variant - Predefined shapes (default, card, text, circle)
 */
export function Shimmer({ className, variant = "default" }: ShimmerProps) {
  const variantClasses = {
    default: "h-4 w-full",
    card: "h-48 w-full rounded-2xl",
    text: "h-4 w-3/4",
    circle: "h-12 w-12 rounded-full",
  };

  return (
    <div
      className={cn(
        "shimmer-effect animate-shimmer",
        variantClasses[variant],
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * ShimmerGroup Component
 *
 * Multiple shimmer lines for text content.
 */
interface ShimmerGroupProps {
  lines?: number;
  className?: string;
}

export function ShimmerGroup({ lines = 3, className }: ShimmerGroupProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          variant={i === lines - 1 ? "text" : "default"}
          className={i === 0 ? "h-5 w-1/2" : undefined}
        />
      ))}
    </div>
  );
}
