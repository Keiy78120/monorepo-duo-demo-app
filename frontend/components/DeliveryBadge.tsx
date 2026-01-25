"use client";

import { Truck, Zap, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type DeliveryVariant = "premium" | "express" | "standard";

interface DeliveryBadgeProps {
  variant?: DeliveryVariant;
  className?: string;
}

const variants: Record<DeliveryVariant, {
  label: string;
  icon: typeof Truck;
  bg: string;
  text: string;
  glow: string;
}> = {
  premium: {
    label: "Livraison Premium",
    icon: Truck,
    bg: "bg-amber-500/90",
    text: "text-white",
    glow: "shadow-[0_0_12px_oklch(0.70_0.15_60_/_0.5)]",
  },
  express: {
    label: "Express",
    icon: Zap,
    bg: "bg-cyan-500/90",
    text: "text-white",
    glow: "shadow-[0_0_12px_oklch(0.65_0.18_200_/_0.5)]",
  },
  standard: {
    label: "Livraison",
    icon: Package,
    bg: "bg-emerald-500/90",
    text: "text-white",
    glow: "shadow-[0_0_12px_oklch(0.60_0.16_160_/_0.5)]",
  },
};

export function DeliveryBadge({ variant = "premium", className }: DeliveryBadgeProps) {
  const v = variants[variant];
  const Icon = v.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-semibold backdrop-blur-md",
        v.bg,
        v.text,
        v.glow,
        "animate-delivery-glow",
        className
      )}
    >
      <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      {v.label}
    </div>
  );
}
