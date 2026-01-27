import { Shimmer } from "@/components/ui/shimmer";

/**
 * Global Loading State
 *
 * Displays a loading skeleton while pages are loading.
 * Uses Shimmer component for better perceived performance.
 */
export default function Loading() {
  return (
    <div className="min-h-screen p-4 bg-[var(--color-background)]">
      {/* Header skeleton */}
      <div className="mb-6">
        <Shimmer className="h-8 w-48 mb-2" />
        <Shimmer className="h-4 w-64" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-4">
            <Shimmer variant="card" className="h-48" />
            <Shimmer className="h-6 w-3/4" />
            <Shimmer variant="text" className="h-4" />
            <Shimmer className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
