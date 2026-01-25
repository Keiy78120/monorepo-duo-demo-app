"use client";

import { cn } from "@/lib/utils";
import { Leaf, Sparkles, Cherry } from "lucide-react";

// Strain type colors
const STRAIN_TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  indica: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  sativa: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  hybrid: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
};

interface StrainTypeBadgeProps {
  type: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

export function StrainTypeBadge({ type, size = "md", className }: StrainTypeBadgeProps) {
  if (!type) return null;

  const normalizedType = type.toLowerCase();
  const style = STRAIN_TYPE_STYLES[normalizedType] || STRAIN_TYPE_STYLES.hybrid;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        style.bg,
        style.text,
        style.border,
        sizeClasses,
        className
      )}
    >
      <Leaf className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span className="capitalize">{type}</span>
    </span>
  );
}

interface EffectBadgeProps {
  effect: string;
  size?: "sm" | "md";
  className?: string;
}

export function EffectBadge({ effect, size = "md", className }: EffectBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
        "border border-[var(--color-border)]",
        sizeClasses,
        className
      )}
    >
      <Sparkles className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{effect}</span>
    </span>
  );
}

interface FlavorBadgeProps {
  flavor: string;
  size?: "sm" | "md";
  className?: string;
}

export function FlavorBadge({ flavor, size = "md", className }: FlavorBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        "bg-[var(--color-accent)]/10 text-[var(--color-accent-foreground)]",
        "border border-[var(--color-accent)]/20",
        sizeClasses,
        className
      )}
    >
      <Cherry className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{flavor}</span>
    </span>
  );
}

interface StrainBadgesProps {
  type?: string | null;
  effects?: string[] | null;
  flavors?: string[] | null;
  size?: "sm" | "md";
  maxEffects?: number;
  maxFlavors?: number;
  className?: string;
  showLabels?: boolean;
}

export function StrainBadges({
  type,
  effects,
  flavors,
  size = "md",
  maxEffects = 3,
  maxFlavors = 3,
  className,
  showLabels = false,
}: StrainBadgesProps) {
  const displayEffects = effects?.slice(0, maxEffects) || [];
  const displayFlavors = flavors?.slice(0, maxFlavors) || [];

  const hasContent = type || displayEffects.length > 0 || displayFlavors.length > 0;

  if (!hasContent) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Strain Type */}
      {type && (
        <div className="flex flex-wrap gap-1.5">
          <StrainTypeBadge type={type} size={size} />
        </div>
      )}

      {/* Effects */}
      {displayEffects.length > 0 && (
        <div>
          {showLabels && (
            <p className="text-[10px] text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">
              Effets
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {displayEffects.map((effect) => (
              <EffectBadge key={effect} effect={effect} size={size} />
            ))}
            {effects && effects.length > maxEffects && (
              <span className="inline-flex items-center text-[10px] text-[var(--color-muted-foreground)]">
                +{effects.length - maxEffects}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Flavors */}
      {displayFlavors.length > 0 && (
        <div>
          {showLabels && (
            <p className="text-[10px] text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">
              Saveurs
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {displayFlavors.map((flavor) => (
              <FlavorBadge key={flavor} flavor={flavor} size={size} />
            ))}
            {flavors && flavors.length > maxFlavors && (
              <span className="inline-flex items-center text-[10px] text-[var(--color-muted-foreground)]">
                +{flavors.length - maxFlavors}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton for loading state
export function StrainBadgesSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1.5">
        <div className="h-6 w-16 rounded-full bg-[var(--color-muted)] animate-pulse" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-6 w-20 rounded-full bg-[var(--color-muted)] animate-pulse" />
        <div className="h-6 w-16 rounded-full bg-[var(--color-muted)] animate-pulse" />
      </div>
    </div>
  );
}
