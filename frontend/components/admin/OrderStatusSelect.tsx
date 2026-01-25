"use client";

import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

interface OrderStatusSelectProps {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
  disabled?: boolean;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: {
    label: "En attente",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/20 hover:bg-yellow-500/30",
  },
  confirmed: {
    label: "Confirmé",
    color: "text-blue-600",
    bgColor: "bg-blue-500/20 hover:bg-blue-500/30",
  },
  processing: {
    label: "Préparation",
    color: "text-purple-600",
    bgColor: "bg-purple-500/20 hover:bg-purple-500/30",
  },
  shipped: {
    label: "En route",
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/20 hover:bg-cyan-500/30",
  },
  delivered: {
    label: "Livré",
    color: "text-green-600",
    bgColor: "bg-green-500/20 hover:bg-green-500/30",
  },
  cancelled: {
    label: "Annulé",
    color: "text-red-600",
    bgColor: "bg-red-500/20 hover:bg-red-500/30",
  },
};

const STATUS_ORDER: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export function OrderStatusSelect({ value, onChange, disabled }: OrderStatusSelectProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_ORDER.map((status) => {
        const config = STATUS_CONFIG[status];
        const isActive = value === status;

        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            disabled={disabled}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              config.bgColor,
              config.color,
              isActive && "ring-2 ring-offset-2 ring-[var(--color-primary)]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

// Badge component for display-only status
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.bgColor,
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
